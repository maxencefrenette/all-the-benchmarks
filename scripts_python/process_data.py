import pandas as pd
import yaml
from pathlib import Path
from math import log10, floor
from typing import Optional, Dict

import numpy as np

def round_sig(x: float, sig: int) -> float:
    if x == 0:
        return 0
    return round(x, sig - 1 - floor(log10(abs(x))))

def load_benchmark(file_path: Path) -> pd.DataFrame:
    data = yaml.safe_load(file_path.read_text())

    results = data.get("results", {})
    results_df = pd.DataFrame(list(results.items()), columns=["alias", "score"])
    results_df["score"] = pd.to_numeric(results_df["score"], errors="coerce")
    cost_per_task = data.get("cost_per_task", {})
    cost_df = pd.DataFrame(list(cost_per_task.items()), columns=["alias", "cost"])
    cost_df["cost"] = pd.to_numeric(cost_df["cost"], errors="coerce")

    df = pd.merge(results_df, cost_df, on="alias", how="outer")
    df = df.drop_duplicates(subset=["alias"])
    df["benchmark"] = file_path.stem
    df["cost_weight"] = data.get("cost_weight", 1.0)
    df["score_weight"] = data.get("score_weight", 1.0)
    df["model_name_mapping_file"] = Path(data["model_name_mapping_file"]).stem

    return df

def load_mapping_file(file_path: Path) -> pd.DataFrame:
    data = yaml.safe_load(file_path.read_text())
    df = pd.DataFrame(list(data.items()), columns=["alias", "slug"])
    df["model_name_mapping_file"] = file_path.stem
    return df

def compute_normalization_factors(
    cost_df: pd.DataFrame,
    weights: Optional[pd.Series] = None,
    iterations: int = 20,
) -> pd.Series:
    """Return per-benchmark factors using rank 1 SVD via ALS.

    ``cost_df`` should have benchmarks as the index and model slugs as columns.
    ``weights`` is an optional Series indexed by benchmark controlling each
    benchmark's contribution to the least squares objective. Benchmarks that
    lack cost information receive ``NaN`` in the resulting Series.
    """

    if cost_df.empty:
        return pd.Series(dtype=float)

    cost_df = cost_df.astype(float)
    if weights is None:
        weights = pd.Series(1.0, index=cost_df.index)
    else:
        weights = weights.reindex(cost_df.index).fillna(1.0).astype(float)

    u = pd.Series(1.0, index=cost_df.index, dtype=float)
    v = pd.Series(1.0, index=cost_df.columns, dtype=float)

    mask = cost_df.notna()
    filled = cost_df.fillna(0.0)

    for _ in range(iterations):
        numerator_v = (filled.mul(weights * u, axis=0)).sum(axis=0)
        denominator_v = (mask.mul(weights * u * u, axis=0)).sum(axis=0)
        v = numerator_v.div(denominator_v).fillna(v)

        numerator_u = (filled.mul(v, axis=1)).sum(axis=1)
        denominator_u = (mask.mul(v * v, axis=1)).sum(axis=1)
        u = numerator_u.div(denominator_u).fillna(u)

    factors = u.apply(lambda x: 1.0 / x if x else np.nan)
    return factors


def normalize_benchmark_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Add a ``normalized_score`` column per benchmark."""

    df = df.copy()
    df["cost"] = df["cost"].replace(0, np.nan)

    grouped = df.groupby("benchmark")
    min_scores = grouped["score"].transform("min")
    max_scores = grouped["score"].transform("max")
    df["normalized_score"] = np.where(
        max_scores != min_scores,
        (df["score"] - min_scores) / (max_scores - min_scores) * 100,
        100.0,
    )
    return df



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
    bench_dir = root / "data" / "raw" / "benchmarks"
    mapping_dir = root / "data" / "config" / "mappings"
    out_dir = root / "data" / "processed" / "benchmarks"
    out_dir.mkdir(exist_ok=True)

    bench_frames = [load_benchmark(f) for f in bench_dir.glob("*.yaml")]
    bench_frames = [df for df in bench_frames if not df.empty]
    benchmarks_df = pd.concat(bench_frames, ignore_index=True)

    map_frames = [load_mapping_file(f) for f in mapping_dir.glob("*.yaml")]
    map_frames = [df for df in map_frames if not df.empty]
    mapping_df = pd.concat(map_frames, ignore_index=True)
    benchmarks_df = benchmarks_df.merge(
        mapping_df,
        on=["alias", "model_name_mapping_file"],
        how="left",
    )
    benchmarks_df = benchmarks_df.dropna(subset=["slug"])[
        [
            "benchmark",
            "slug",
            "score",
            "cost",
            "cost_weight",
            "score_weight",
        ]
    ]

    benchmarks_df = normalize_benchmark_scores(benchmarks_df)

    cost_df = (
        benchmarks_df.dropna(subset=["cost"])
        .pivot_table(index="benchmark", columns="slug", values="cost", aggfunc="first")
    )

    weights = benchmarks_df.groupby("benchmark")["cost_weight"].first()

    factors = (
        compute_normalization_factors(cost_df, weights).to_dict() if not cost_df.empty else {}
    )

    for bench_name, df in benchmarks_df.groupby("benchmark"):
        df = df.sort_values(by=["score", "cost", "slug"], ascending=[False, True, True])
        factor = factors.get(bench_name)
        out_dict = build_output(
            df[["slug", "score", "normalized_score", "cost"]],
            factor,
        )
        out_path = out_dir / f"{bench_name}.yaml"
        out_path.write_text(yaml.safe_dump(out_dict, sort_keys=False))


if __name__ == "__main__":
    main()
