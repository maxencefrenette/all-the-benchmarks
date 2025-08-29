# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js routes, layouts, pages.
- `components/`: Reusable UI built on shadcn/ui.
- `hooks/`: Lightweight React hooks (e.g., `use-*.ts`).
- `lib/`: YAML loaders, scoring, and helpers.
- `data/`: Benchmarks and model YAML; processed outputs.
- `scripts/`: Scrapers that fill `data/raw/benchmarks`.
- `scripts_python/`: Python utilities (run with `uv`).
- `public/`, `styles/`: Static assets and Tailwind CSS.

## Build, Test, and Development Commands

- Install: `pnpm install` (first run).
- Dev server: `pnpm dev` (Next.js local server).
- Lint + fix: `pnpm lint`; check only: `pnpm lint:check`.
- Format: `pnpm prettier`; check only: `pnpm prettier:check`.
- Tests (Vitest): `pnpm test`; update snapshots: `pnpm test:update`.
- Type check: `pnpm build` to ensure type safety.
- Scraping: `pnpm scrape:all`.
- Data processing: `pnpm process:all` and `pnpm mappings:update`.

## Coding Style & Naming Conventions

- Language: TypeScript + React, Tailwind CSS.
- Style: ESLint + Prettier (2‑space indent, semicolons, single quotes where configured).
- Components: PascalCase in `components/`; hooks: `use-*` files in `hooks/`.
- Routes: follow Next.js `app/` conventions and folder‑based routing.
- Use shadcn/ui via CLI: `pnpm dlx shadcn-ui@latest add <component>`.

## Testing Guidelines

- Framework: Vitest with snapshots where appropriate.
- Name tests near code or in `__tests__` using `*.test.ts(x)`.
- Before pushing: run `pnpm test` and refresh snapshots with `pnpm test:update` when UI or output changes are intended.

## Commit & Pull Request Guidelines

- Commits: Prefer Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `test:`). Keep messages concise and scoped.
- Documentation: prefix doc-only commits with `docs:` and mention affected sections.
- PRs: Include a clear summary, linked issues, and screenshots/GIFs for UI changes. Note data/script updates and whether snapshots changed.
- Reference issues in commit messages or PR descriptions using keywords like `Closes #123` when applicable.
- CI hygiene: run `pnpm prettier`, `pnpm lint`, `pnpm test:update` locally; ensure data processed if benchmarks changed.

## Data & Benchmarks

- New benchmark: add YAML under `data/raw/benchmarks/`, a scraper in `scripts/`, run processing commands above, and update workflow as needed.
- New model: add file in `data/config/models/` with `model`, `provider`, and comprehensive `aliases` gathered from benchmark keys and release notes.
