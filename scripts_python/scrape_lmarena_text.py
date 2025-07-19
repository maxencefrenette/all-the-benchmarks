import json
import re
import pickle
import types
import sys
from pathlib import Path
from urllib.request import urlopen

import yaml

class Dummy:
    def __init__(self, *a, **k):
        pass

class DummySubplotRef(Dummy):
    pass

MODS = [
    "plotly",
    "plotly.graph_objs",
    "plotly.graph_objs._figure",
    "plotly._subplots",
    "matplotlib",
    "matplotlib.pyplot",
]


def fetch(url: str) -> bytes:
    with urlopen(url) as resp:
        return resp.read()


def fetch_latest_pkl() -> bytes:
    meta_text = fetch(
        "https://huggingface.co/api/spaces/lmarena-ai/chatbot-arena-leaderboard?raw=1"
    ).decode()
    json_start = meta_text.index("{")
    meta = json.loads(meta_text[json_start:])
    filenames = [
        s["rfilename"]
        for s in meta.get("siblings", [])
        if re.match(r"^elo_results_.*\.pkl$", s.get("rfilename", ""))
    ]
    if not filenames:
        raise RuntimeError("Unable to find latest results file")
    latest = sorted(filenames)[-1]
    return fetch(
        f"https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/{latest}"
    )


def parse_pkl(pkl_data: bytes) -> dict[str, float]:
    for m in MODS:
        mod = types.ModuleType(m)
        mod.Figure = Dummy
        mod.SubplotRef = DummySubplotRef
        sys.modules[m] = mod

    data = pickle.loads(pkl_data)
    df = data["text"]["full"]["leaderboard_table_df"]
    return {name: float(rating) for name, rating in df["rating"].items()}


def save_benchmark_results(out_path: Path, results: dict[str, float]) -> None:
    yaml_obj = {}
    if out_path.exists():
        try:
            yaml_obj = yaml.safe_load(out_path.read_text()) or {}
        except Exception:
            yaml_obj = {}

    existing_results = yaml_obj.get("results")
    if not results and existing_results:
        print(f"Skipping update for {out_path} because new data is empty")
        return

    yaml_obj["results"] = results
    out_path.write_text(yaml.safe_dump(yaml_obj, sort_keys=False))
    print(f"Wrote {out_path}")


def main() -> None:
    pkl_data = fetch_latest_pkl()
    results = parse_pkl(pkl_data)
    root = Path(__file__).resolve().parents[1]
    out_path = root / "data" / "raw" / "benchmarks" / "lmarena-text.yaml"
    save_benchmark_results(out_path, results)


if __name__ == "__main__":
    main()
