import os
import glob
from typing import Dict, Tuple

import numpy as np
import pandas as pd
import yaml
from scipy.optimize import minimize

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "benchmarks")


def load_scores() -> pd.DataFrame:
    records = []
    for path in glob.glob(os.path.join(DATA_DIR, "*.yaml")):
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        benchmark = os.path.splitext(os.path.basename(path))[0]
        for model, res in data.items():
            if model == "sigmoid":
                continue
            score = res.get("score")
            if score is None:
                continue
            records.append({"benchmark": benchmark, "model": model, "score": float(score)})
    return pd.DataFrame.from_records(records)


def fit_ability_model(df: pd.DataFrame) -> Tuple[Dict[str, float], Dict[str, Dict[str, float]], float]:
    models = sorted(df["model"].unique().tolist())
    benches = sorted(df["benchmark"].unique().tolist())
    m2i = {m: i for i, m in enumerate(models)}
    b2i = {b: i for i, b in enumerate(benches)}

    y = df["score"].to_numpy()
    model_idx = df["model"].map(m2i).to_numpy()
    bench_idx = df["benchmark"].map(b2i).to_numpy()

    M = len(models)
    B = len(benches)

    # initialization
    model_means = df.groupby("model")["score"].mean()
    raw_a = model_means.reindex(models).fillna(0).to_numpy()
    raw_a = (raw_a - raw_a.mean()) / (raw_a.std() or 1)

    min_b = []
    log_range_b = []
    mid_b = []
    log_slope_b = []
    for b in benches:
        scores = df[df["benchmark"] == b]["score"]
        y_min = scores.min()
        y_max = scores.max()
        span = y_max - y_min
        if span == 0:
            span = 1.0
        min_b.append(y_min - 0.1 * span)
        log_range_b.append(np.log(span * 1.2))
        mid_b.append(0.0)
        log_slope_b.append(0.0)

    sigma_init = df["score"].std() or 1.0
    log_sigma = np.log(sigma_init)

    x0 = np.concatenate([
        raw_a,
        np.array(min_b),
        np.array(log_range_b),
        np.array(mid_b),
        np.array(log_slope_b),
        np.array([log_sigma]),
    ])

    def unpack(params):
        idx = 0
        raw_a = params[idx : idx + M]
        idx += M
        min_b = params[idx : idx + B]
        idx += B
        log_range_b = params[idx : idx + B]
        idx += B
        mid_b = params[idx : idx + B]
        idx += B
        log_slope_b = params[idx : idx + B]
        idx += B
        log_sigma = params[idx]

        a = raw_a - raw_a.mean()
        std = raw_a.std()
        if std > 0:
            a = a / std
        range_b = np.exp(log_range_b)
        max_b = min_b + range_b
        slope_b = np.exp(log_slope_b)
        sigma = np.exp(log_sigma)
        return a, min_b, max_b, mid_b, slope_b, sigma

    def predict(a, min_b, max_b, mid_b, slope_b):
        return min_b[bench_idx] + (max_b[bench_idx] - min_b[bench_idx]) / (
            1.0 + np.exp(-(a[model_idx] - mid_b[bench_idx]) / slope_b[bench_idx])
        )

    def nll(params):
        a, min_b, max_b, mid_b, slope_b, sigma = unpack(params)
        pred = predict(a, min_b, max_b, mid_b, slope_b)
        resid = y - pred
        return 0.5 * np.sum((resid / sigma) ** 2 + 2 * np.log(sigma) + np.log(2 * np.pi))

    res = minimize(nll, x0, method="BFGS")
    a, min_b, max_b, mid_b, slope_b, sigma = unpack(res.x)

    abilities = {m: float(a[i]) for m, i in m2i.items()}
    bench_params = {
        b: {
            "min": float(min_b[i]),
            "max": float(max_b[i]),
            "midpoint": float(mid_b[i]),
            "slope": float(slope_b[i]),
        }
        for b, i in b2i.items()
    }
    return abilities, bench_params, float(sigma)


def main():
    df = load_scores()
    abilities, bench_params, sigma = fit_ability_model(df)

    abilities_path = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "model_abilities.yaml")
    with open(abilities_path, "w") as f:
        yaml.safe_dump(abilities, f, sort_keys=True)

    residual_path = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "residuals.yaml")
    with open(residual_path, "w") as f:
        yaml.safe_dump({"sigma": sigma}, f, sort_keys=True)

    # update benchmark files
    for slug, params in bench_params.items():
        path = os.path.join(DATA_DIR, f"{slug}.yaml")
        if not os.path.exists(path):
            continue
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        data["sigmoid"] = params
        with open(path, "w") as f:
            yaml.safe_dump(data, f, sort_keys=True)


if __name__ == "__main__":
    main()
