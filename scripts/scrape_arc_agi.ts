import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main(): Promise<void> {
  const datasets = JSON.parse(
    curl("https://arcprize.org/media/data/leaderboard/datasets.json"),
  ) as Array<{ id: string; displayName: string }>
  const models = JSON.parse(
    curl("https://arcprize.org/media/data/leaderboard/models.json"),
  ) as Array<{ id: string; displayName: string }>
  const evaluations = JSON.parse(
    curl("https://arcprize.org/media/data/leaderboard/evaluations.json"),
  ) as Array<{
    datasetId: string
    modelId: string
    score: number
    costPerTask?: number
    display?: boolean
  }>

  const modelMap: Record<string, string> = {}
  for (const m of models) modelMap[m.id] = m.displayName

  const datasetMap: Record<string, string> = {
    v1_Semi_Private: "arc-agi-1.yaml",
    v2_Semi_Private: "arc-agi-2.yaml",
  }

  for (const [datasetId, fileName] of Object.entries(datasetMap)) {
    const entries = evaluations.filter(
      (e) => e.datasetId === datasetId && (e as any).display,
    )
    entries.sort((a, b) => b.score - a.score)

    const results: Record<string, number> = {}
    const costPerTask: Record<string, number> = {}
    for (const e of entries) {
      let score = e.score
      if (score > 0 && score <= 1) score *= 100
      const name = modelMap[e.modelId] || e.modelId
      results[name] = Math.round(score * 10) / 10
      if (typeof e.costPerTask === "number") {
        costPerTask[name] = e.costPerTask
      }
    }

    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "raw",
      "benchmarks",
      fileName,
    )
    await saveBenchmarkResults(outPath, results, costPerTask)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
