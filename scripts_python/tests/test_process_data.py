import sys
from pathlib import Path
import yaml

# Add scripts_python directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from process_data import process_benchmark


def test_process_benchmark(tmp_path: Path):
    bench_file = tmp_path / "bench.yaml"
    mapping_dir = tmp_path
    out_dir = tmp_path / "out"
    out_dir.mkdir()

    bench_data = {
        "model_name_mapping_file": "map.yaml",
        "results": {
            "Model A": 0.9,
            "Model B": 0.5,
            "Model C": 0.8,
        },
        "cost_per_task": {
            "Model A": 0.1,
            "Model B": 0.2,
            "Model C": 0.3,
        },
    }
    bench_file.write_text(yaml.safe_dump(bench_data, sort_keys=False))

    mapping_data = {
        "Model A": "slug-a",
        "Model B": "slug-b",
    }
    (mapping_dir / "map.yaml").write_text(yaml.safe_dump(mapping_data, sort_keys=False))

    process_benchmark(bench_file, mapping_dir, out_dir)

    output_path = out_dir / "bench.yaml"
    output = yaml.safe_load(output_path.read_text())

    expected = {
        "slug-a": {"score": 0.9, "cost": 0.1, "normalized_score": 100.0},
        "slug-b": {"score": 0.5, "cost": 0.2, "normalized_score": 0.0},
    }
    assert output == expected


def test_zero_cost_ignored(tmp_path: Path):
    bench_file = tmp_path / "bench.yaml"
    mapping_dir = tmp_path
    out_dir = tmp_path / "out"
    out_dir.mkdir()

    bench_data = {
        "model_name_mapping_file": "map.yaml",
        "results": {
            "Model A": 1.0,
            "Model B": 0.8,
        },
        "cost_per_task": {
            "Model A": 0.1,
            "Model B": 0.0,
        },
    }
    bench_file.write_text(yaml.safe_dump(bench_data, sort_keys=False))

    mapping_data = {
        "Model A": "slug-a",
        "Model B": "slug-b",
    }
    (mapping_dir / "map.yaml").write_text(yaml.safe_dump(mapping_data, sort_keys=False))

    costs = process_benchmark(bench_file, mapping_dir, out_dir)

    output_path = out_dir / "bench.yaml"
    output = yaml.safe_load(output_path.read_text())

    expected = {
        "slug-a": {"score": 1.0, "cost": 0.1, "normalized_score": 100.0},
        "slug-b": {"score": 0.8, "normalized_score": 0.0},
    }
    assert output == expected
    assert costs == {"slug-a": 0.1}
