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

def load_benchmark(file_path: Path) -> pd.DataFrame:
    data = yaml.safe_load(file_path.read_text())

    results = data.get("results", {})
    results_df = pd.DataFrame(list(results.items()), columns=["alias", "score"])
    cost_per_task = data.get("cost_per_task", {})
    cost_df = pd.DataFrame(list(cost_per_task.items()), columns=["alias", "cost"])

    df = pd.merge(results_df, cost_df, on="alias", how="outer")
    df = df.drop_duplicates(subset=["alias"])
    df["benchmark"] = file_path.stem
    df["cost_weight"] = data.get("cost_weight", 1.0)
    df["score_weight"] = data.get("score_weight", 1.0)
    df["model_name_mapping_file"] = data["model_name_mapping_file"]

    return df

def load_mapping_file(file_path: Path) -> pd.DataFrame:
    data = yaml.safe_load(file_path.read_text())
    df = pd.DataFrame(list(data.items()), columns=["alias", "slug"])
    df["model_name_mapping_file"] = file_path.stem
    return df

def compute_normalization_factors(
    cost_map: dict[str, dict[str, float]],
    weights: Optional[dict[str, float]] = None,
    iterations: int = 20,
) -> dict[str, Optional[float]]:
    """Return per-benchmark factors using rank 1 SVD via ALS.

    Benchmarks that lack cost information receive ``None`` as the factor. If
    ``weights`` is provided, each benchmark contributes ``weight`` times as much
    to the least squares objective – effectively the same as repeating the
    benchmark ``weight`` times.
    """

    df = pd.DataFrame(cost_map).T
    if df.empty:
        return {}

    weights_series = pd.Series(
        {b: (weights.get(b, 1.0) if weights else 1.0) for b in df.index},
        dtype=float,
    )

    u = pd.Series(1.0, index=df.index, dtype=float)
    v = pd.Series(1.0, index=df.columns, dtype=float)

    mask = df.notna()
    filled = df.fillna(0.0)

    for _ in range(iterations):
        # update v using vectorized operations
        numerator_v = (filled.mul(weights_series * u, axis=0)).sum(axis=0)
        denominator_v = (mask.mul(weights_series * u * u, axis=0)).sum(axis=0)
        v = numerator_v.div(denominator_v).fillna(v)

        # update u
        numerator_u = (filled.mul(v, axis=1)).sum(axis=1)
        denominator_u = (mask.mul(v * v, axis=1)).sum(axis=1)
        u = numerator_u.div(denominator_u).fillna(u)

    return {bench: (1.0 / val if val else None) for bench, val in u.items()}


def process_benchmark(
    file_path: Path, mapping_dir: Path
) -> Tuple[pd.DataFrame, Dict[str, float], float]:
    """Parse a single benchmark YAML and return a DataFrame of results.

    Returns a tuple of the DataFrame, a mapping of model slug to cost, and the
    benchmark's ``cost_weight`` for normalization purposes.
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

    weight = float(data.get("cost_weight", 1))

    return df, cost_out, weight


def build_output(df: pd.DataFrame, factor: Optional[float]) -> Dict[str, Dict[str, float]]:
    """Return a mapping ready for YAML serialization."""

    out_df = df.copy()
    if factor is not None:
        out_df["normalized_cost"] = out_df["cost"] * factor

    for col in ["score", "normalized_score", "cost", "normalized_cost"]:
        if col in out_df.columns:
            out_df[col] = out_df[col].apply(
                lambda x: round_sig(float(x), 5) if pd.notna(x) else x
            )

    records = out_df.set_index("slug").to_dict(orient="index")
    # remove NaN entries
    cleaned = {
        slug: {k: v for k, v in vals.items() if pd.notna(v)}
        for slug, vals in records.items()
    }
    return cleaned


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    bench_dir = root / "data" / "benchmarks"
    mapping_dir = root / "data" / "mappings"
    out_dir = root / "data" / "benchmarks_processed"
    out_dir.mkdir(exist_ok=True)

    cost_data: Dict[str, Dict[str, float]] = {}
    weights: Dict[str, float] = {}
    frames: list[pd.DataFrame] = []

    benchmarks_df = pd.concat([load_benchmark(bench_file) for bench_file in bench_dir.glob("*.yaml")])
    mapping_df = pd.concat([load_mapping_file(mapping_file) for mapping_file in mapping_dir.glob("*.yaml")])
    benchmarks_df = benchmarks_df.merge(mapping_df, on="alias", how="left")
    benchmarks_df = benchmarks_df[["benchmark", "slug", "score", "cost", "cost_weight", "score_weight"]]

    for bench_file in bench_dir.glob("*.yaml"):
        df, costs, weight = process_benchmark(bench_file, mapping_dir)
        df["benchmark"] = bench_file.stem
        frames.append(df)
        if costs:
            cost_data[bench_file.stem] = costs
        weights[bench_file.stem] = weight

    all_df = pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()

    factors = (
        compute_normalization_factors(cost_data, weights) if cost_data else {}
    )

    for bench_name, df in all_df.groupby("benchmark"):
        factor = factors.get(bench_name)
        out_dict = build_output(df.drop(columns="benchmark"), factor)
        out_path = out_dir / f"{bench_name}.yaml"
        out_path.write_text(yaml.safe_dump(out_dict, sort_keys=False))


if __name__ == "__main__":
    main()
