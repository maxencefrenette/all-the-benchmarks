import sys
from pathlib import Path
import yaml

# Add scripts_python directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from update_mappings import update_mapping


def test_update_mapping(tmp_path: Path):
    bench_file = tmp_path / "bench.yaml"
    mapping_dir = tmp_path

    bench_data = {
        "model_name_mapping_file": "map.yaml",
        "results": {
            "Model A": 0.9,
            "Model B": 0.5,
        },
    }
    bench_file.write_text(yaml.safe_dump(bench_data, sort_keys=False))

    # existing mapping only has Model A
    (mapping_dir / "map.yaml").write_text(yaml.safe_dump({"Model A": "slug-a"}, sort_keys=False))

    update_mapping(bench_file, mapping_dir)

    mapping = yaml.safe_load((mapping_dir / "map.yaml").read_text())
    assert mapping == {"Model A": "slug-a", "Model B": None}


def test_union_across_multiple_benchmarks(tmp_path: Path):
    mapping_dir = tmp_path

    bench1 = tmp_path / "b1.yaml"
    bench1.write_text(
        yaml.safe_dump(
            {
                "model_name_mapping_file": "map.yaml",
                "results": {"Model A": 1.0},
            },
            sort_keys=False,
        )
    )

    bench2 = tmp_path / "b2.yaml"
    bench2.write_text(
        yaml.safe_dump(
            {
                "model_name_mapping_file": "map.yaml",
                "results": {"Model B": 0.5},
            },
            sort_keys=False,
        )
    )

    # existing mapping has an entry for Model A
    (mapping_dir / "map.yaml").write_text(
        yaml.safe_dump({"Model A": "slug-a"}, sort_keys=False)
    )

    update_mapping(bench1, mapping_dir)
    update_mapping(bench2, mapping_dir)

    mapping = yaml.safe_load((mapping_dir / "map.yaml").read_text())
    assert mapping == {
        "Model A": "slug-a",
        "Model B": None,
    }
