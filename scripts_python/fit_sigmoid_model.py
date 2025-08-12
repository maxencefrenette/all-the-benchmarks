import yaml
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed" / "benchmarks"


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


def initialise(df: pd.DataFrame):
    models = sorted(df["model"].unique())
    benchmarks = sorted(df["benchmark"].unique())
    m2i = {m: i for i, m in enumerate(models)}
    b2i = {b: i for i, b in enumerate(benchmarks)}
    y = df["score"].values
    model_idx = df["model"].map(m2i).values
    bench_idx = df["benchmark"].map(b2i).values

    model_means = df.groupby("model")["score"].mean()
    raw_a = model_means.reindex(models).fillna(0).values
    raw_a = (raw_a - raw_a.mean()) / (raw_a.std() or 1)

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
        [raw_a, min_b, log_range_b, mid_b, log_slope_b, [log_sigma]]
    )
    return params, models, benchmarks, y, model_idx, bench_idx


def unpack(params, M, B):
    raw_a = params[:M]
    min_b = params[M : M + B]
    log_range_b = params[M + B : M + 2 * B]
    mid_b = params[M + 2 * B : M + 3 * B]
    log_slope_b = params[M + 3 * B : M + 4 * B]
    log_sigma = params[-1]

    a = raw_a - raw_a.mean()
    std = raw_a.std()
    if std > 0:
        a = a / std

    range_b = np.exp(log_range_b)
    max_b = min_b + range_b
    slope_b = np.exp(log_slope_b)
    sigma = np.exp(log_sigma)
    return a, min_b, max_b, mid_b, slope_b, sigma


def predict(a, min_b, max_b, mid_b, slope_b, model_idx, bench_idx):
    return min_b[bench_idx] + (
        (max_b[bench_idx] - min_b[bench_idx])
        / (1 + np.exp(-(a[model_idx] - mid_b[bench_idx]) / slope_b[bench_idx]))
    )


def neg_loglike(params, M, B, y, model_idx, bench_idx):
    a, min_b, max_b, mid_b, slope_b, sigma = unpack(params, M, B)
    pred = predict(a, min_b, max_b, mid_b, slope_b, model_idx, bench_idx)
    resid = y - pred
    return 0.5 * np.sum((resid / sigma) ** 2 + 2 * np.log(sigma) + np.log(2 * np.pi))


def save_outputs(a, benchmarks, min_b, max_b, mid_b, slope_b, sigma, models):
    abilities = {m: float(ai) for m, ai in zip(models, a)}
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
    params, models, benchmarks, y, model_idx, bench_idx = initialise(df)
    M, B = len(models), len(benchmarks)
    result = minimize(
        neg_loglike,
        params,
        args=(M, B, y, model_idx, bench_idx),
        method="Powell",
    )
    a, min_b, max_b, mid_b, slope_b, sigma = unpack(result.x, M, B)
    save_outputs(a, benchmarks, min_b, max_b, mid_b, slope_b, sigma, models)


if __name__ == "__main__":
    main()
