from pathlib import Path
from typing import Dict, Optional

import pandas as pd
import yaml


def update_mapping(bench_file: Path, mapping_dir: Path) -> None:
    """Update mapping file for a single benchmark YAML."""
    data = yaml.safe_load(bench_file.read_text()) or {}
    mapping_name = data.get("model_name_mapping_file")
    if not mapping_name:
        return
    map_path = mapping_dir / mapping_name
    existing: Dict[str, Optional[str]] = {}
    if map_path.exists():
        existing = yaml.safe_load(map_path.read_text()) or {}

    results = data.get("results", {})

    # Merge new model names with existing mapping entries
    for name in results.keys():
        existing.setdefault(name, None)

    # Write models in sorted order for stable diffs
    df = pd.DataFrame({"alias": list(existing.keys()), "slug": list(existing.values())})
    df = df.sort_values("alias")
    sorted_map = dict(zip(df["alias"], df["slug"]))
    map_path.write_text(yaml.safe_dump(sorted_map, sort_keys=False))


def update_all_mappings(bench_dir: Path, mapping_dir: Path) -> None:
    """Update mapping files for all benchmarks, merging shared files."""
    mappings: Dict[str, Dict[str, Optional[str]]] = {}

    for bench_file in bench_dir.glob("*.yaml"):
        data = yaml.safe_load(bench_file.read_text()) or {}
        mapping_name = data.get("model_name_mapping_file")
        if not mapping_name:
            continue
        results = data.get("results", {})

        if mapping_name not in mappings:
            map_path = mapping_dir / mapping_name
            existing = {}
            if map_path.exists():
                existing = yaml.safe_load(map_path.read_text()) or {}
            mappings[mapping_name] = existing

        for name in results.keys():
            mappings[mapping_name].setdefault(name, None)

    for mapping_name, entries in mappings.items():
        df = pd.DataFrame({"alias": list(entries.keys()), "slug": list(entries.values())})
        df = df.sort_values("alias")
        sorted_map = dict(zip(df["alias"], df["slug"]))
        map_path = mapping_dir / mapping_name
        map_path.write_text(yaml.safe_dump(sorted_map, sort_keys=False))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"

    update_all_mappings(bench_dir, mapping_dir)


if __name__ == "__main__":
    main()
