from pathlib import Path
from typing import Dict, Optional

import pandas as pd
import yaml

def load_benchmark(bench_file: Path) -> pd.DataFrame:
    """Load benchmark YAML file."""
    data = yaml.safe_load(bench_file.read_text())
    model_name_mapping_file = data.get("model_name_mapping_file")
    raw_model_names = set(data.get("results", {}).keys()) | set(data.get("costs", {}).keys())
    df = pd.DataFrame({
        "alias": list(raw_model_names),
        "model_name_mapping_file": [model_name_mapping_file] * len(raw_model_names),
    })
    return df

def load_mapping(mapping_file: Path) -> pd.DataFrame:
    """Load mapping file."""
    data = yaml.safe_load(mapping_file.read_text())
    df = pd.DataFrame({
        "alias": list(data.keys()),
        "slug": list(data.values()),
        "model_name_mapping_file": [mapping_file.name] * len(data),
    })
    return df

def update_all_mappings(bench_dir: Path, mapping_dir: Path) -> None:
    """Update mapping files for all benchmarks, merging shared files."""

    bench_df = pd.concat([load_benchmark(bench_file) for bench_file in bench_dir.glob("*.yaml")])
    mapping_df = pd.concat([load_mapping(mapping_file) for mapping_file in mapping_dir.glob("*.yaml")])
    mapping_df = mapping_df.drop_duplicates(subset=["alias", "model_name_mapping_file"])

    merged_df = pd.merge(bench_df, mapping_df, on=["alias", "model_name_mapping_file"], how="left")
    merged_df = merged_df.sort_values("alias", key=lambda x: x.str.lower())

    # Write to mapping files
    for model_name_mapping_file, df in merged_df.groupby("model_name_mapping_file"):
        mapping_file = mapping_dir / model_name_mapping_file
        mapping_file.write_text(yaml.safe_dump(dict(zip(df["alias"], df["slug"])), sort_keys=False))
    


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"

    update_all_mappings(bench_dir, mapping_dir)


if __name__ == "__main__":
    main()
