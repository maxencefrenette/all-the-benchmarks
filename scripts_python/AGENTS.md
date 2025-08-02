This directory contains scripts used to process the raw data from benchmarks.

Important commands:

- Install dependencies `uv sync`
- Run tests `uv run pytest`
- Process benchmark data `uv run process_data.py`
- Add new models to the mappings files `uv run update_mappings.py`
- After running the Python scripts execute `pnpm process:all` so the Next.js app picks up the new data

## Code Style

When processing data, use idiomatic pandas instead of lists of dicts. Keep each script small and focused so it can be reused from other tooling.
