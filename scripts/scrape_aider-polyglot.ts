import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"
import YAML from "yaml"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Entry {
  model: string
  pass_rate_2: number | string
  test_cases?: number | string
  total_cost?: number | string
}

async function main(): Promise<void> {
  const yamlText = curl(
    "https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/polyglot_leaderboard.yml",
  )
  const data = YAML.parse(yamlText) as Entry[]
  const results: Record<string, number> = {}
  const costPerTask: Record<string, number> = {}
  for (const entry of data) {
    const score = parseFloat(String(entry.pass_rate_2))
    if (!isNaN(score) && entry.model) {
      results[entry.model] = score

      const totalCost = parseFloat(String(entry.total_cost))
      const cases = parseFloat(String(entry.test_cases))
      if (!isNaN(totalCost) && !isNaN(cases) && cases > 0) {
        const cpt = Math.round((totalCost / cases) * 10000) / 10000
        costPerTask[entry.model] = cpt
      }
    }
  }
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "aider-polyglot.yaml",
  )
  await saveBenchmarkResults(outPath, results, costPerTask)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
