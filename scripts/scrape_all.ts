import { execSync } from "child_process"

const scripts = [
  "scrape:livebench",
  "scrape:simplebench",
  "scrape:lmarena-text",
  "scrape:arc-agi",
  "scrape:aider-polyglot",
  "scrape:hle",
  "scrape:gpqa-diamond",
  "scrape:artificial-analysis-index",
]

for (const script of scripts) {
  console.log(`Running ${script}...`)
  execSync(`pnpm run ${script}`, { stdio: "inherit" })
}
