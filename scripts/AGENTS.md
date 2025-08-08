# Scraping scripts guidelines

This directory contains TypeScript utilities for fetching benchmark results.
Each script is executed with `tsx` so it can use modern TypeScript features.

## Adding a new script

- Name the file `scrape_<benchmark>.ts`.
- Use `curl` and `saveBenchmarkResults` from `utils.ts` to write YAML under `data/raw/benchmarks`.
- Register a command in `package.json` like `"scrape:<benchmark>": "tsx scripts/scrape_<benchmark>.ts"`.
- Run `pnpm lint` and `pnpm prettier` before committing changes.
- Execute `pnpm test` to confirm the repository still builds.
- After scraping new results run `pnpm mappings:update` so the model mapping files pick up any new names.
