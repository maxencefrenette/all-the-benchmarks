import pickle
import sys
import types

class Dummy:
    def __init__(self, *a, **k):
        pass

class DummySubplotRef(Dummy):
    pass

mods = [
    'plotly',
    'plotly.graph_objs',
    'plotly.graph_objs._figure',
    'plotly._subplots',
    'matplotlib',
    'matplotlib.pyplot',
]
for m in mods:
    mod = types.ModuleType(m)
    mod.Figure = Dummy
    mod.SubplotRef = DummySubplotRef
    sys.modules[m] = mod

with open(sys.argv[1], 'rb') as f:
    data = pickle.load(f)

df = data['text']['full']['leaderboard_table_df']
for name, rating in df['rating'].items():
    print(f"{name}\t{rating}")
