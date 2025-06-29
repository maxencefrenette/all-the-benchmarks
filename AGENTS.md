# pnpm usage

This repository uses pnpm as package manager.

- Run linting: `pnpm lint`
- Run build: `pnpm build`
- Run Prettier: `pnpm prettier`

# Adding shadcn/ui components

Use the shadcn/ui CLI to scaffold new components. Run `pnpm dlx shadcn-ui@latest add <component>`.

# Adding benchmarks

To add a new benchmark to the leaderboard:

- Create a YAML file under `public/data/benchmarks/` containing the benchmark name, description and a `results` mapping.
- Create a scraping script under `scripts/` that generates the benchmark YAML and
  add a corresponding npm script in `package.json`.

# Model YAML files

Model definitions live in `public/data/models`. Each file includes `model`, `provider`, and optional `aliases`.

# Editing this file

Whenever you learn something new, add it to this file.
