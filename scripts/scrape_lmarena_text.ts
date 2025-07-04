import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"
import YAML from "yaml"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function curl(url: string): string {
  return execSync(`curl -sL ${url}`, { encoding: "utf8" })
}

async function main(): Promise<void> {
  const md = curl("https://r.jina.ai/https://lmarena.ai/leaderboard/text")
  const lines = md.split("\n")
  const results: Record<string, number> = {}
  const regex =
    /^\|\s*\d+\s*\|\s*(?:!\[[^\]]*\]\([^)]*\)\s*)?\[([^\]]+)\]\([^)]*\)\s*\|\s*(\d+(?:\.\d+)?)\s*\|/
  for (const line of lines) {
    const m = line.match(regex)
    if (m) {
      const model = m[1]
      const score = parseFloat(m[2])
      results[model] = score
    }
  }
  const yamlObj = {
    benchmark: "LMArena Text",
    description: "Elo score on LMArena Text leaderboard",
    results,
  }
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "lmarena-text.yaml",
  )
  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
