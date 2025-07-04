import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import YAML from "yaml"
import vm from "vm"
import { curl } from "./utils"

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
  const yamlObj = {
    benchmark: "SimpleBench",
    description: "Score (AVG@5) on SimpleBench",
    results,
  }
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "simplebench.yaml",
  )
  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
