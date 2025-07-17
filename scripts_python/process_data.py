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
    cost_per_task = data.get("cost_per_task", {})
    cost_df = pd.DataFrame(list(cost_per_task.items()), columns=["alias", "cost"])

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


def normalize_benchmarks(df: pd.DataFrame) -> pd.DataFrame:
    """Add a ``normalized_score`` column per benchmark."""

    df = df.copy()
    df["cost"] = df["cost"].replace(0, np.nan)

    def _norm(group: pd.DataFrame) -> pd.DataFrame:
        min_score = group["score"].min()
        max_score = group["score"].max()
        if max_score != min_score:
            group["normalized_score"] = (group["score"] - min_score) / (max_score - min_score) * 100
        else:
            group["normalized_score"] = 100.0
        return group

    return df.groupby("benchmark", group_keys=False).apply(_norm)



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
    out_dir = root / "data" / "processed" / "benchmarks"
    out_dir.mkdir(exist_ok=True)

    benchmarks_df = pd.concat(
        [load_benchmark(f) for f in bench_dir.glob("*.yaml")]
    )
    mapping_df = pd.concat(
        [load_mapping_file(f) for f in mapping_dir.glob("*.yaml")]
    )
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

    benchmarks_df = normalize_benchmarks(benchmarks_df)

    cost_data = (
        benchmarks_df.dropna(subset=["cost"])
        .groupby("benchmark")
        .apply(lambda g: g.set_index("slug")["cost"].to_dict())
        .to_dict()
    )

    weights = (
        benchmarks_df.groupby("benchmark")["cost_weight"].first().to_dict()
    )

    factors = (
        compute_normalization_factors(cost_data, weights) if cost_data else {}
    )

    for bench_name, df in benchmarks_df.groupby("benchmark"):
        factor = factors.get(bench_name)
        out_dict = build_output(
            df[["slug", "score", "normalized_score", "cost"]],
            factor,
        )
        out_path = out_dir / f"{bench_name}.yaml"
        out_path.write_text(yaml.safe_dump(out_dict, sort_keys=False))


if __name__ == "__main__":
    main()
