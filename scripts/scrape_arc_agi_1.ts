import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"
import YAML from "yaml"

function curl(url: string): string {
  return execSync(`curl -sL ${url}`, { encoding: "utf8" })
}

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
    display?: boolean
  }>

  const datasetId = "v1_Semi_Private"
  const dataset = datasets.find((d) => d.id === datasetId)
  if (!dataset) throw new Error("Dataset not found")

  const modelMap: Record<string, string> = {}
  for (const m of models) modelMap[m.id] = m.displayName

  const entries = evaluations.filter(
    (e) => e.datasetId === datasetId && (e as any).display,
  )
  entries.sort((a, b) => b.score - a.score)

  const results: Record<string, number> = {}
  for (const e of entries) {
    let score = e.score
    if (score > 0 && score <= 1) score *= 100
    results[modelMap[e.modelId] || e.modelId] = Math.round(score * 10) / 10
  }

  const yamlObj = {
    benchmark: dataset.displayName,
    description: "Accuracy on ARC-AGI-1",
    results,
  }

  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "arc-agi-1.yaml",
  )
  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
