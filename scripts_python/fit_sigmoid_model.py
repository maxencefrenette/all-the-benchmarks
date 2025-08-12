import yaml
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed" / "benchmarks"
MODELS_DIR = ROOT / "data" / "config" / "models"
OFFSET_REG = 1.0


def load_model_configs():
    base_models = set()
    variant_to_base: dict[str, str] = {}
    for file in MODELS_DIR.glob("*.yaml"):
        base = file.stem
        base_models.add(base)
        data = yaml.safe_load(file.read_text()) or {}
        for variant in (data.get("reasoning_efforts") or {}):
            variant_to_base[variant] = base
    return sorted(base_models), variant_to_base


def load_scores() -> pd.DataFrame:
    rows = []
    for file in PROCESSED_DIR.glob("*.yaml"):
        bench = file.stem
        data = yaml.safe_load(file.read_text()) or {}
        for model, res in data.items():
            if model == "sigmoid":
                continue
            score = res.get("score")
            if score is None:
                continue
            rows.append({"model": model, "benchmark": bench, "score": float(score)})
    return pd.DataFrame(rows)


def initialise(df: pd.DataFrame, base_models, variant_to_base):
    base_models = sorted(base_models)
    variants = sorted(variant_to_base.keys())
    benchmarks = sorted(df["benchmark"].unique())
    base2i = {b: i for i, b in enumerate(base_models)}
    v2i = {v: i for i, v in enumerate(variants)}
    b2i = {b: i for i, b in enumerate(benchmarks)}

    df = df.copy()
    df["base"] = df["model"].map(variant_to_base)

    y = df["score"].values
    base_idx = df["base"].map(base2i).values
    var_idx = df["model"].map(v2i).values
    bench_idx = df["benchmark"].map(b2i).values

    base_means = df.groupby("base")["score"].mean()
    raw_base = base_means.reindex(base_models).fillna(0).values
    raw_base = (raw_base - raw_base.mean()) / (raw_base.std() or 1)

    variant_means = df.groupby("model")["score"].mean()
    offsets = [
        variant_means.get(v, base_means.get(variant_to_base[v], 0))
        - base_means.get(variant_to_base[v], 0)
        for v in variants
    ]

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
        [raw_base, offsets, min_b, log_range_b, mid_b, log_slope_b, [log_sigma]]
    )
    return (
        params,
        base_models,
        variants,
        benchmarks,
        y,
        base_idx,
        var_idx,
        bench_idx,
    )


def unpack(params, M, V, B):
    raw_base = params[:M]
    offsets = params[M : M + V]
    min_b = params[M + V : M + V + B]
    log_range_b = params[M + V + B : M + V + 2 * B]
    mid_b = params[M + V + 2 * B : M + V + 3 * B]
    log_slope_b = params[M + V + 3 * B : M + V + 4 * B]
    log_sigma = params[-1]

    base = raw_base - raw_base.mean()
    std = raw_base.std()
    if std > 0:
        base = base / std

    range_b = np.exp(log_range_b)
    max_b = min_b + range_b
    slope_b = np.exp(log_slope_b)
    sigma = np.exp(log_sigma)
    return base, offsets, min_b, max_b, mid_b, slope_b, sigma


def predict(base, offsets, min_b, max_b, mid_b, slope_b, base_idx, var_idx, bench_idx):
    ability = base[base_idx] + offsets[var_idx]
    return min_b[bench_idx] + (
        (max_b[bench_idx] - min_b[bench_idx])
        / (1 + np.exp(-(ability - mid_b[bench_idx]) / slope_b[bench_idx]))
    )


def neg_loglike(params, M, V, B, y, base_idx, var_idx, bench_idx):
    base, offsets, min_b, max_b, mid_b, slope_b, sigma = unpack(params, M, V, B)
    pred = predict(base, offsets, min_b, max_b, mid_b, slope_b, base_idx, var_idx, bench_idx)
    resid = y - pred
    penalty = OFFSET_REG * np.sum(offsets**2)
    return 0.5 * np.sum((resid / sigma) ** 2 + 2 * np.log(sigma) + np.log(2 * np.pi)) + penalty


def save_outputs(
    base,
    offsets,
    base_models,
    variants,
    variant_to_base,
    benchmarks,
    min_b,
    max_b,
    mid_b,
    slope_b,
    sigma,
):
    v2i = {v: i for i, v in enumerate(variants)}
    abilities = {}
    for i, base_model in enumerate(base_models):
        offs = {
            v: float(offsets[v2i[v]])
            for v in variants
            if variant_to_base[v] == base_model
        }
        abilities[base_model] = {"base": float(base[i]), "offsets": offs}

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
    base_models, variant_to_base = load_model_configs()
    (
        params,
        base_models,
        variants,
        benchmarks,
        y,
        base_idx,
        var_idx,
        bench_idx,
    ) = initialise(df, base_models, variant_to_base)
    M, V, B = len(base_models), len(variants), len(benchmarks)
    result = minimize(
        neg_loglike,
        params,
        args=(M, V, B, y, base_idx, var_idx, bench_idx),
        method="Powell",
    )
    base, offsets, min_b, max_b, mid_b, slope_b, sigma = unpack(result.x, M, V, B)
    save_outputs(
        base,
        offsets,
        base_models,
        variants,
        variant_to_base,
        benchmarks,
        min_b,
        max_b,
        mid_b,
        slope_b,
        sigma,
    )


if __name__ == "__main__":
    main()
