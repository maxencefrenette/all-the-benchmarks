import { execSync } from "child_process"

/**
 * Run all scraping scripts sequentially. The LMArena scraper is now
 * implemented in Python and executed via `uv run` through its pnpm script.
 */
const scripts: readonly string[] = [
  "scrape:livebench",
  "scrape:simplebench",
  "scrape:lmarena-text",
  "scrape:arc-agi",
  "scrape:aider-polyglot",
  "scrape:hle",
  "scrape:gpqa-diamond",
  "scrape:mmlu-pro",
  "scrape:matharena",
  "scrape:artificial-analysis-index",
  "scrape:weirdml",
]

for (const script of scripts) {
  console.log(`Running ${script}...`)
  execSync(`pnpm run ${script}`, { stdio: "inherit" })
}
