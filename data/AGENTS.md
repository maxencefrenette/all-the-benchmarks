# Data directory overview

This folder stores YAML files consumed by the application and populated by scraping scripts.

## Subdirectories

- `benchmarks/` – Benchmark result files. Each contains `benchmark`, `description`, `results` and optionally `cost_per_task`. The scraping scripts under `scripts/` update the `results` and `cost_per_task` sections automatically.
- `mappings/` – Model name mapping files. When a scraping script writes a benchmark file, it also ensures the corresponding mapping YAML is updated with any new model names. Mapping values that associate an alias to a known model slug are maintained manually.
- `models/` – Model definitions. Historically each YAML only described a single
  model slug with `model` and `provider` fields. We are migrating to a format
  where a file can define multiple slugs using a top level `models:` mapping.
  Both formats are supported by the code while this migration is in progress.
  Currently only the `o3` model uses the new `models:` syntax.

## How the code interacts with these files

- `lib/data-loader.ts` reads all YAML from `models/`, `benchmarks/` and `mappings/` to merge benchmark scores and compute per‑model statistics used throughout the site.
- `lib/benchmark-loader.ts` loads benchmark metadata and details from `benchmarks/` for individual benchmark pages.
- Next.js route handlers in `app/` call these loader functions to build pages.
- Scraping utilities in `scripts/` (e.g. `scrape_livebench.ts`) download data from external leaderboards and call `saveBenchmarkResults` from `scripts/utils.ts` to update files in `benchmarks/` and `mappings/`.

## Generation details

- Files inside `models/` are **manually generated**.
- Files inside `benchmarks/` and `mappings/` are **partially automatically generated** – the scraping scripts overwrite score sections and add new model keys but preserve manual descriptions and mappings.
