# pnpm usage

This repository uses pnpm as package manager.

- Run linting: `pnpm lint`
- Run build: `pnpm build`
- Run Prettier: `pnpm prettier`

# Adding shadcn/ui components

Use the shadcn/ui CLI to scaffold new components. Run `pnpm dlx shadcn-ui@latest add <component>`.

# Model YAML files

Model definitions live in `public/data/models`. Each file includes `model`, `provider`, and optional `aliases`.
To show a new model on the leaderboard, add its slug to `modelSlugs` in `lib/data-loader.ts`.

# Editing this file

Whenever you learn something new, add it to this file.
