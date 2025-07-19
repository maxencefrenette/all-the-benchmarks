import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main(): Promise<void> {
  const js = curl("https://eqbench.com/eqbench3.js")
  const match = js.match(/leaderboardDataEQBench3\s*=\s*`([^`]+)`/)
  if (!match) throw new Error("Failed to extract leaderboard data")
  const data = match[1]

  const lines = data.trim().split(/\r?\n/).slice(1)
  const results: Record<string, number> = {}
  for (const line of lines) {
    const parts = line.split(",")
    const name = parts[0].replace(/^\*/, "")
    const score = parseFloat(parts[1])
    if (!isNaN(score)) {
      results[name] = score
    }
  }
  const outPath = path.join(
    __dirname,
    "..",
    "data",
    "raw",
    "benchmarks",
    "eqbench3.yaml",
  )
  await saveBenchmarkResults(outPath, results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
