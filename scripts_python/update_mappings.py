import yaml
from pathlib import Path


def update_mapping(bench_file: Path, mapping_dir: Path) -> None:
    """Update mapping file for a single benchmark YAML."""
    data = yaml.safe_load(bench_file.read_text()) or {}
    mapping_name = data.get("model_name_mapping_file")
    if not mapping_name:
        return
    map_path = mapping_dir / mapping_name
    existing = {}
    if map_path.exists():
        existing = yaml.safe_load(map_path.read_text()) or {}

    results = data.get("results", {})

    # Merge new model names with existing mapping entries
    for name in results.keys():
        existing.setdefault(name, None)

    # Write models in sorted order for stable diffs
    sorted_map = {
        name: existing[name] for name in sorted(existing.keys())
    }
    map_path.write_text(yaml.safe_dump(sorted_map, sort_keys=False))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"

    for bench_file in bench_dir.glob("*.yaml"):
        update_mapping(bench_file, mapping_dir)


if __name__ == "__main__":
    main()
