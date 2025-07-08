# pnpm usage

This repository uses pnpm as package manager.

- Run linting and autofix: `pnpm lint`
- Validate linting without fixes: `pnpm lint:check`
- Run Prettier and write changes: `pnpm prettier`
- Validate formatting without writing: `pnpm prettier:check`
- Run the test suite: `pnpm test`
- Update snapshot tests: `pnpm test:update`

## Project structure

This repository is a Next.js application. Key directories include:

- `app/` – Route handlers and page components.
- `components/` – Shared React components built on top of shadcn/ui.
- `hooks/` – Small React hooks used across the UI.
- `lib/` – Helper functions for loading YAML data and computing scores.
- `public/` – Static assets. The `data/` subdirectory stores benchmark and model YAML files.
- `scripts/` – Scrapers that populate `public/data/benchmarks`.
- `styles/` – Global and Tailwind CSS files.

# Adding shadcn/ui components

Use the shadcn/ui CLI to scaffold new components. Run `pnpm dlx shadcn-ui@latest add <component>`.

# Adding benchmarks

To add a new benchmark to the leaderboard:

- Create a YAML file under `public/data/benchmarks/` containing the benchmark name, description and a `results` mapping.
- Create a scraping script under `scripts/` that generates the benchmark YAML and
  add a corresponding npm script in `package.json`.

# Model YAML files

Model definitions live in `public/data/models`. Each file includes `model`, `provider`, and optional `aliases`.

To add a new model to the leaderboard:

- Search the web for release notes or documentation to learn the official version names and differences between variants of the model. Capture all known names.
- Create a new YAML file in `public/data/models/` containing the `model` name and `provider`.
- Look at the benchmark YAML files `results` keys to find all the aliases for the model.
- Add every variant or version string as an entry under `aliases`.

# Editing this file

Whenever you learn something new, add it to this file.
