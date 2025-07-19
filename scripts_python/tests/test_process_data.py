import sys
from pathlib import Path
import yaml
import pytest
import pandas as pd

# Add scripts_python directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from process_data import (
    load_benchmark,
    load_mapping_file,
    normalize_benchmark_scores,
    build_output,
    compute_normalization_factors,
)


def test_normalize_benchmarks(tmp_path: Path):
    bench_file = tmp_path / "bench.yaml"
    mapping_dir = tmp_path

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

    bench_df = load_benchmark(bench_file)
    map_df = load_mapping_file(mapping_dir / "map.yaml")
    df = bench_df.merge(map_df, on="alias", how="left")[["benchmark", "slug", "score", "cost", "cost_weight"]]
    df = df.dropna(subset=["slug"])
    df = normalize_benchmark_scores(df)
    output = build_output(df[["slug", "score", "normalized_score", "cost"]], None)

    expected = {
        "slug-a": {"score": 0.9, "cost": 0.1, "normalized_score": 100.0},
        "slug-b": {"score": 0.5, "cost": 0.2, "normalized_score": 0.0},
    }
    assert output == expected
    assert df["cost_weight"].iloc[0] == 1.0


def test_zero_cost_ignored(tmp_path: Path):
    bench_file = tmp_path / "bench.yaml"
    mapping_dir = tmp_path

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

    bench_df = load_benchmark(bench_file)
    map_df = load_mapping_file(mapping_dir / "map.yaml")
    df = bench_df.merge(map_df, on="alias", how="left")[["benchmark", "slug", "score", "cost", "cost_weight"]]
    df = df.dropna(subset=["slug"])
    df = normalize_benchmark_scores(df)
    output = build_output(df[["slug", "score", "normalized_score", "cost"]], None)

    expected = {
        "slug-a": {"score": 1.0, "cost": 0.1, "normalized_score": 100.0},
        "slug-b": {"score": 0.8, "normalized_score": 0.0},
    }
    assert output == expected
    assert df.set_index("slug")["cost"].dropna().to_dict() == {"slug-a": 0.1}
    assert df["cost_weight"].iloc[0] == 1.0


def test_compute_normalization_factors_weighted() -> None:
    cost_map = {
        "b1": {"m1": 1.0, "m2": 2.0},
        "b2": {"m1": 3.0, "m2": 6.0},
    }
    weights = {"b1": 1.0, "b2": 4.0}

    cost_df = pd.DataFrame(cost_map).T
    weight_series = pd.Series(weights)

    unweighted = compute_normalization_factors(cost_df)
    weighted = compute_normalization_factors(cost_df, weight_series)

    assert unweighted["b1"] == pytest.approx(2.0)
    assert unweighted["b2"] == pytest.approx(2.0 / 3.0, rel=1e-6)

    assert weighted["b1"] == pytest.approx(2.6, rel=1e-6)
    assert weighted["b2"] == pytest.approx(13.0 / 15.0, rel=1e-6)


def test_weight_equivalence_repetition() -> None:
    """A weight of 2 is equivalent to repeating the benchmark twice."""
    single_map = {"b": {"m1": 1.0, "m2": 2.0}}
    single_weight = {"b": 2.0}

    repeated_map = {"b1": {"m1": 1.0, "m2": 2.0}, "b2": {"m1": 1.0, "m2": 2.0}}
    repeated_weight = {"b1": 1.0, "b2": 1.0}

    single_df = pd.DataFrame(single_map).T
    single_weight_series = pd.Series(single_weight)

    repeated_df = pd.DataFrame(repeated_map).T
    repeated_weight_series = pd.Series(repeated_weight)

    single = compute_normalization_factors(single_df, single_weight_series)
    repeated = compute_normalization_factors(repeated_df, repeated_weight_series)

    assert single["b"] == pytest.approx(repeated["b1"], rel=1e-6)
    assert repeated["b1"] == pytest.approx(repeated["b2"], rel=1e-6)


def test_weight_scaling_equivalence() -> None:
    """Scaling all weights by a constant shouldn't change the result."""
    cost_map = {"A": {"m": 1.0}, "B": {"m": 4.0}}
    weights_a = {"A": 0.5, "B": 1.0}
    weights_b = {"A": 1.0, "B": 2.0}

    cost_df = pd.DataFrame(cost_map).T
    w_a = pd.Series(weights_a)
    w_b = pd.Series(weights_b)

    f_a = compute_normalization_factors(cost_df, w_a)
    f_b = compute_normalization_factors(cost_df, w_b)

    assert f_a["A"] == pytest.approx(f_b["A"], rel=1e-6)
    assert f_a["B"] == pytest.approx(f_b["B"], rel=1e-6)
