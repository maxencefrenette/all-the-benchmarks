import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"

type ResultsRow = Record<string, number | string>

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main(): Promise<void> {
  const json = curl("https://matharena.ai/results")
  const data = JSON.parse(json) as {
    competition_info: Record<string, { nice_name: string }>
    results: Record<string, ResultsRow[]>
  }

  for (const [key, rows] of Object.entries(data.results)) {
    const info = data.competition_info[key]
    if (!info) continue
    const niceName = info.nice_name || key
    const slug = `matharena-${slugify(niceName)}`

    const avgRow = rows.find((r) => r.question === "Avg") as
      | ResultsRow
      | undefined
    const costRow = rows.find((r) => r.question === "Cost") as
      | ResultsRow
      | undefined
    if (!avgRow) continue

    const results: Record<string, number> = {}
    for (const [model, value] of Object.entries(avgRow)) {
      if (model === "question") continue
      if (typeof value === "number") {
        results[model] = value
      }
    }

    const costs: Record<string, number> = {}
    if (costRow) {
      for (const [model, value] of Object.entries(costRow)) {
        if (model === "question") continue
        const num =
          typeof value === "number" ? value : parseFloat(value as string)
        if (!isNaN(num)) costs[model] = num
      }
    }

    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "benchmarks",
      `${slug}.yaml`,
    )
    await saveBenchmarkResults(outPath, results, costs)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
