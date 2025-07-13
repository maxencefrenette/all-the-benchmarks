import pandas as pd
import yaml
from pathlib import Path
from math import log10, floor
from typing import Optional, Tuple, Dict

import numpy as np

def round_sig(x: float, sig: int) -> float:
    if x == 0:
        return 0
    return round(x, sig - 1 - floor(log10(abs(x))))

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
    file_path: Path, mapping_dir: Path
) -> Tuple[pd.DataFrame, Dict[str, float]]:
    """Parse a single benchmark YAML and return a DataFrame of results.

    The returned ``dict`` maps model slugs to their cost for use when
    computing normalization factors.
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
    cost_series = pd.Series(cost_map).replace(0, np.nan).rename("cost")
    df = df.merge(cost_series, left_on="alias", right_index=True, how="left")

    df = df.sort_values(by=["score", "cost", "slug"], ascending=[False, True, True])

    min_score = df["score"].min()
    max_score = df["score"].max()
    if max_score != min_score:
        df["normalized_score"] = (df["score"] - min_score) / (max_score - min_score) * 100
    else:
        df["normalized_score"] = 100.0

    df = df[["slug", "score", "normalized_score", "cost"]]

    cost_out = df.set_index("slug")["cost"].dropna().to_dict()

    return df, cost_out


def build_output(df: pd.DataFrame, factor: Optional[float]) -> Dict[str, Dict[str, float]]:
    """Return a mapping ready for YAML serialization."""
    out_df = df.copy()
    if factor is not None:
        out_df["normalized_cost"] = out_df["cost"] * factor
    else:
        out_df["normalized_cost"] = np.nan

    out_df["score"] = out_df["score"].apply(lambda x: round_sig(x, 5))
    out_df["normalized_score"] = out_df["normalized_score"].apply(lambda x: round_sig(x, 5))
    out_df["cost"] = out_df["cost"].apply(lambda x: round_sig(float(x), 5) if pd.notna(x) else x)
    out_df["normalized_cost"] = out_df["normalized_cost"].apply(lambda x: round_sig(float(x), 5) if pd.notna(x) else x)

    result: Dict[str, Dict[str, float]] = {}
    for row in out_df.itertuples(index=False):
        entry = {"score": row.score, "normalized_score": row.normalized_score}
        if not pd.isna(row.cost):
            entry["cost"] = row.cost
        if not pd.isna(row.normalized_cost):
            entry["normalized_cost"] = row.normalized_cost
        result[row.slug] = entry
    return result


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"
    out_dir = root / "data" / "benchmarks_processed"
    out_dir.mkdir(exist_ok=True)

    cost_data: Dict[str, Dict[str, float]] = {}
    frames: Dict[str, pd.DataFrame] = {}

    for bench_file in bench_dir.glob("*.yaml"):
        df, costs = process_benchmark(bench_file, mapping_dir)
        frames[bench_file.stem] = df
        if costs:
            cost_data[bench_file.stem] = costs

    factors = compute_normalization_factors(cost_data) if cost_data else {}

    for bench_name, df in frames.items():
        factor = factors.get(bench_name)
        out_dict = build_output(df, factor)
        out_path = out_dir / f"{bench_name}.yaml"
        out_path.write_text(yaml.safe_dump(out_dict, sort_keys=False))


if __name__ == "__main__":
    main()
