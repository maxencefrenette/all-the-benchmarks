import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "lmarena-text.yaml",
  )
  await saveBenchmarkResults(outPath, results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
