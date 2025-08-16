import yaml
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed" / "benchmarks"
MODEL_CONFIG_DIR = ROOT / "data" / "config" / "models"


def load_model_configs():
    base_models = set()
    variant_to_base = {}
    for file in MODEL_CONFIG_DIR.glob("*.yaml"):
        base = file.stem
        base_models.add(base)
        data = yaml.safe_load(file.read_text()) or {}
        for variant in (data.get("reasoning_efforts") or {}):
            variant_to_base[variant] = base
    return base_models, variant_to_base


BASE_MODELS, VARIANT_TO_BASE = load_model_configs()


def load_scores() -> pd.DataFrame:
    rows = []
    for file in PROCESSED_DIR.glob("*.yaml"):
        bench = file.stem
        data = yaml.safe_load(file.read_text()) or {}
        for model, res in data.items():
            if model == "sigmoid" or model not in VARIANT_TO_BASE:
                continue
            score = res.get("score")
            if score is None:
                continue
            rows.append({"model": model, "benchmark": bench, "score": float(score)})
    return pd.DataFrame(rows)


def initialise(df: pd.DataFrame):
    base_models = sorted(BASE_MODELS)
    variants = sorted(VARIANT_TO_BASE.keys())
    b2i = {b: i for i, b in enumerate(base_models)}
    v2i = {v: i for i, v in enumerate(variants)}

    y = df["score"].values
    base_idx = df["model"].map(lambda m: b2i[VARIANT_TO_BASE[m]]).values
    variant_idx = df["model"].map(v2i).values

    benchmarks = sorted(df["benchmark"].unique())
    b2i_bench = {b: i for i, b in enumerate(benchmarks)}
    bench_idx = df["benchmark"].map(b2i_bench).values
    observed_variants = set(df["model"].unique())

    df_base = df.assign(base=df["model"].map(VARIANT_TO_BASE))
    model_means = df_base.groupby("base")["score"].mean()
    raw_a = model_means.reindex(base_models).fillna(0).values
    raw_a = (raw_a - raw_a.mean()) / (raw_a.std() or 1)
    offsets = np.zeros(len(variants))

    grouped = df.groupby("benchmark")["score"]
    y_min = grouped.min().reindex(benchmarks).values
    y_max = grouped.max().reindex(benchmarks).values
    ranges = y_max - y_min
    min_b = y_min - 0.1 * ranges
    max_b = y_max + 0.1 * ranges
    range_b = max_b - min_b

    mid_b = np.zeros(len(benchmarks))
    log_range_b = np.log(range_b)
    log_slope_b = np.zeros(len(benchmarks))

    sigma = df["score"].std() or 1e-3
    log_sigma = np.log(sigma)

    params = np.concatenate(
        [raw_a, offsets, min_b, log_range_b, mid_b, log_slope_b, [log_sigma]]
    )
    return (
        params,
        base_models,
        benchmarks,
        y,
        base_idx,
        bench_idx,
        variant_idx,
        variants,
        observed_variants,
    )


def unpack(params, M, V, B):
    raw_a = params[:M]
    offsets = params[M : M + V]
    min_b = params[M + V : M + V + B]
    log_range_b = params[M + V + B : M + V + 2 * B]
    mid_b = params[M + V + 2 * B : M + V + 3 * B]
    log_slope_b = params[M + V + 3 * B : M + V + 4 * B]
    log_sigma = params[-1]

    a = raw_a - raw_a.mean()
    std = raw_a.std()
    if std > 0:
        a = a / std

    range_b = np.exp(log_range_b)
    max_b = min_b + range_b
    slope_b = np.exp(log_slope_b)
    sigma = np.exp(log_sigma)
    return a, offsets, min_b, max_b, mid_b, slope_b, sigma


def predict(a, offsets, min_b, max_b, mid_b, slope_b, base_idx, bench_idx, variant_idx):
    ability = a[base_idx] + offsets[variant_idx]
    return min_b[bench_idx] + (
        (max_b[bench_idx] - min_b[bench_idx])
        / (1 + np.exp(-(ability - mid_b[bench_idx]) / slope_b[bench_idx]))
    )


def neg_loglike(params, M, V, B, y, base_idx, bench_idx, variant_idx):
    a, offsets, min_b, max_b, mid_b, slope_b, sigma = unpack(params, M, V, B)
    pred = predict(a, offsets, min_b, max_b, mid_b, slope_b, base_idx, bench_idx, variant_idx)
    resid = y - pred
    return 0.5 * np.sum((resid / sigma) ** 2 + 2 * np.log(sigma) + np.log(2 * np.pi))


def save_outputs(a, offsets, benchmarks, min_b, max_b, mid_b, slope_b, sigma, base_models, variants):
    abilities = {b: {"base": float(ai), "offsets": {}} for b, ai in zip(base_models, a)}
    for v, off in zip(variants, offsets):
        abilities[VARIANT_TO_BASE[v]]["offsets"][v] = float(off)

    out_dir = ROOT / "data" / "processed"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "model_abilities.yaml").write_text(
        yaml.safe_dump(abilities, sort_keys=True)
    )

    # residuals
    (out_dir / "residuals.yaml").write_text(
        yaml.safe_dump({"sigma": float(sigma)}, sort_keys=False)
    )

    for b, mn, mx, md, sl in zip(benchmarks, min_b, max_b, mid_b, slope_b):
        file = PROCESSED_DIR / f"{b}.yaml"
        data = yaml.safe_load(file.read_text()) or {}
        data["sigmoid"] = {
            "min": float(mn),
            "max": float(mx),
            "midpoint": float(md),
            "slope": float(sl),
        }
        file.write_text(yaml.safe_dump(data, sort_keys=False))


def main():
    df = load_scores()
    if df.empty:
        raise SystemExit("No scores found")
    (
        params,
        base_models,
        benchmarks,
        y,
        base_idx,
        bench_idx,
        variant_idx,
        variants,
        observed,
    ) = initialise(df)
    M, V, B = len(base_models), len(variants), len(benchmarks)
    result = minimize(
        neg_loglike,
        params,
        args=(M, V, B, y, base_idx, bench_idx, variant_idx),
        method="Powell",
    )
    a, offsets, min_b, max_b, mid_b, slope_b, sigma = unpack(result.x, M, V, B)
    for i, v in enumerate(variants):
        if v not in observed:
            offsets[i] = 0.0
    save_outputs(
        a,
        offsets,
        benchmarks,
        min_b,
        max_b,
        mid_b,
        slope_b,
        sigma,
        base_models,
        variants,
    )


if __name__ == "__main__":
    main()
