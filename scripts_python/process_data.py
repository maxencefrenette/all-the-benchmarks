import pandas as pd
import yaml
from pathlib import Path
import numpy as np


from typing import Optional


def compute_normalization_factors(
    cost_map: dict[str, dict[str, float]], iterations: int = 20
) -> dict[str, Optional[float]]:
    """Return per-benchmark factors using rank 1 SVD via ALS.

    Benchmarks that lack cost information receive ``None`` as the factor."""
    benchmarks = list(cost_map.keys())
    models = sorted({m for costs in cost_map.values() for m in costs})
    b_count, m_count = len(benchmarks), len(models)
    if b_count == 0 or m_count == 0:
        return {}

    # matrices of observed costs and mask
    C = np.zeros((b_count, m_count), dtype=float)
    W = np.zeros((b_count, m_count), dtype=bool)
    for i, bench in enumerate(benchmarks):
        for j, model in enumerate(models):
            val = cost_map[bench].get(model)
            if val is not None:
                C[i, j] = float(val)
                W[i, j] = True

    u = np.ones(b_count, dtype=float)
    v = np.ones(m_count, dtype=float)

    for _ in range(iterations):
        # update v
        for j in range(m_count):
            mask = W[:, j]
            if mask.any():
                numerator = np.dot(u[mask], C[mask, j])
                denominator = np.dot(u[mask], u[mask])
                if denominator:
                    v[j] = numerator / denominator
        # update u
        for i in range(b_count):
            mask = W[i]
            if mask.any():
                numerator = np.dot(v[mask], C[i, mask])
                denominator = np.dot(v[mask], v[mask])
                if denominator:
                    u[i] = numerator / denominator

    factors = {
        benchmarks[i]: (1.0 / u[i] if u[i] else None) for i in range(b_count)
    }
    return factors


def process_benchmark(
    file_path: Path, mapping_dir: Path, out_dir: Path
) -> dict[str, float]:
    """Process a single benchmark YAML and write mapped results.

    Returns a mapping of model slug to cost for this benchmark.
    """
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
    cost_series = cost_series.replace(0, np.nan)
    df = df.merge(cost_series, left_on="alias", right_index=True, how="left")

    df = df[["slug", "score", "cost"]].sort_values(
        by=["score", "cost", "slug"], ascending=[False, True, True]
    )

    min_score = df["score"].min()
    max_score = df["score"].max()
    if max_score != min_score:
        df["normalized"] = (df["score"] - min_score) / (max_score - min_score) * 100
    else:
        df["normalized"] = 100.0

    output = {}
    cost_out: dict[str, float] = {}
    for _, row in df.iterrows():
        entry = {
            "score": float(row["score"]),
            "normalized_score": float(row["normalized"]),
        }
        if pd.notna(row.get("cost")):
            cost_val = float(row["cost"])
            entry["cost"] = cost_val
            cost_out[row["slug"]] = cost_val
        output[row["slug"]] = entry

    out_path = out_dir / file_path.name
    out_path.write_text(yaml.safe_dump(output, sort_keys=False))

    return cost_out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"
    out_dir = root / "data" / "benchmarks_processed"
    out_dir.mkdir(exist_ok=True)

    cost_data: dict[str, dict[str, float]] = {}

    for bench_file in bench_dir.glob("*.yaml"):
        costs = process_benchmark(bench_file, mapping_dir, out_dir)
        if costs:
            cost_data[bench_file.stem] = costs

    if cost_data:
        factors = compute_normalization_factors(cost_data)
        for bench, factor in factors.items():
            proc_path = out_dir / f"{bench}.yaml"
            if not proc_path.exists():
                continue
            data = yaml.safe_load(proc_path.read_text()) or {}
            updated = False
            for entry in data.values():
                cost_val = entry.get("cost")
                if cost_val is not None and factor is not None:
                    entry["normalized_cost"] = float(cost_val * factor)
                    updated = True
            if updated:
                proc_path.write_text(yaml.safe_dump(data, sort_keys=False))


if __name__ == "__main__":
    main()
