import { execSync } from "child_process"

const scripts = [
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
  "scrape:eqbench3",
  "scrape:gorilla-bfcl",
]

for (const script of scripts) {
  console.log(`Running ${script}...`)
  execSync(`pnpm run ${script}`, { stdio: "inherit" })
}
