import path from "path"
import { fileURLToPath } from "url"
import vm from "vm"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Entry {
  rank: string
  model: string
  score: string
  organization: string
}

async function main(): Promise<void> {
  const js = curl("https://simple-bench.com/static/js/leaderboard-data.js")
  const context: { data?: Entry[] } = {}
  vm.runInNewContext(`${js}\nthis.data = leaderboardData`, context)
  const data = context.data
  if (!data) throw new Error("Failed to parse leaderboard data")

  const results: Record<string, number> = {}
  for (const entry of data) {
    const score = parseFloat(entry.score.replace(/%/, ""))
    results[entry.model] = score
  }
  const outPath = path.join(
    __dirname,
    "..",
    "data",
    "benchmarks",
    "simplebench.yaml",
  )
  await saveBenchmarkResults(outPath, results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
