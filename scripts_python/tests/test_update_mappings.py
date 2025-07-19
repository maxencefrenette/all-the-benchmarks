import sys
from pathlib import Path
import yaml

# Add scripts_python directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from update_mappings import update_all_mappings


def test_new_alias_written_as_null(tmp_path: Path) -> None:
    bench_dir = tmp_path / "bench"
    mapping_dir = tmp_path / "map"
    bench_dir.mkdir()
    mapping_dir.mkdir()

    bench_data = {
        "model_name_mapping_file": "map.yaml",
        "results": {"Model A": 1.0, "Model B": 0.5},
    }
    (bench_dir / "bench.yaml").write_text(yaml.safe_dump(bench_data, sort_keys=False))

    mapping_data = {"Model A": "slug-a"}
    (mapping_dir / "map.yaml").write_text(yaml.safe_dump(mapping_data, sort_keys=False))

    update_all_mappings(bench_dir, mapping_dir)

    updated = yaml.safe_load((mapping_dir / "map.yaml").read_text())
    assert updated == {"Model A": "slug-a", "Model B": None}
