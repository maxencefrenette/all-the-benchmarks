import os
import sys
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from fit_ability_model import fit_ability_model

def test_ability_normalization():
    df = pd.DataFrame(
        [
            {"benchmark": "b1", "model": "m1", "score": 0.0},
            {"benchmark": "b1", "model": "m2", "score": 1.0},
            {"benchmark": "b2", "model": "m1", "score": 0.5},
            {"benchmark": "b2", "model": "m2", "score": 1.5},
        ]
    )
    abilities, bench_params, sigma = fit_ability_model(df)
    arr = np.array(list(abilities.values()))
    assert abs(arr.mean()) < 1e-6
    assert np.isclose(arr.std(), 1.0)
    assert set(bench_params.keys()) == {"b1", "b2"}
    assert sigma > 0
