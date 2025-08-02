# All the Benchmarks

This project aggregates scores from popular large language model benchmarks into a single leaderboard.

The goal is to provide a clear comparison of how leading models perform across different tasks. Benchmark results are scraped from official leaderboards, normalized, and averaged so that each benchmark contributes equally to the overall ranking.

Visit the [About page](https://all-the-benchmarks.vercel.app/about) for more details on the methodology.

## Development

This project uses [pnpm](https://pnpm.io) for dependency management. To work on the
project locally:

```bash
pnpm install       # install dependencies
pnpm dev           # start the development server
pnpm lint          # run ESLint with autofix
pnpm prettier      # format code
pnpm test          # run tests
```

For details on how benchmark data is scraped and processed, see the guidance in
[data/AGENTS.md](data/AGENTS.md).
