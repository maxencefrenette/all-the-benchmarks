import pandas as pd
import yaml
from pathlib import Path


def process_benchmark(file_path: Path, mapping_dir: Path, out_dir: Path) -> None:
    """Process a single benchmark YAML and write mapped results."""
    data = yaml.safe_load(file_path.read_text())
    mapping_file = mapping_dir / data.get("model_name_mapping_file", "")
    mapping = {}
    if mapping_file.exists():
        mapping = yaml.safe_load(mapping_file.read_text()) or {}

    results = data.get("results", {})
    df = pd.DataFrame(list(results.items()), columns=["alias", "score"])
    df["slug"] = df["alias"].map(mapping)
    df.dropna(subset=["slug"], inplace=True)

    cost_map = data.get("cost_per_task", {})
    cost_series = pd.Series(cost_map, name="cost")
    df = df.merge(cost_series, left_on="alias", right_index=True, how="left")

    df = df[["slug", "score", "cost"]].sort_values(by="score", ascending=False)

    output = {}
    for _, row in df.iterrows():
        entry = {"score": float(row["score"])}
        if pd.notna(row.get("cost")):
            entry["cost"] = float(row["cost"])
        output[row["slug"]] = entry

    out_path = out_dir / file_path.name
    out_path.write_text(yaml.safe_dump(output, sort_keys=False))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"
    out_dir = root / "data" / "benchmarks_processed"
    out_dir.mkdir(exist_ok=True)

    for bench_file in bench_dir.glob("*.yaml"):
        process_benchmark(bench_file, mapping_dir, out_dir)


if __name__ == "__main__":
    main()
