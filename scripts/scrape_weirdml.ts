import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Row {
  [column: string]: string
}

function parseCSV(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(",")
  return lines.slice(1).map((line) => {
    const values = line.split(",")
    const row: Row = {}
    header.forEach((h, i) => {
      row[h] = values[i]
    })
    return row
  })
}

async function main(): Promise<void> {
  const csv = curl("https://htihle.github.io/data/weirdml_data.csv")
  const rows = parseCSV(csv)
  const results: Record<string, number> = {}
  const costPerTask: Record<string, number> = {}

  for (const row of rows) {
    const name = row["display_name"]
    const acc = parseFloat(row["avg_acc"])
    const cost = parseFloat(row["cost_per_run_usd"])
    if (!Number.isNaN(acc)) {
      results[name] = Math.round(acc * 10000) / 100
    }
    if (!Number.isNaN(cost)) {
      costPerTask[name] = cost
    }
  }

  const outPath = path.join(
    __dirname,
    "..",
    "data",
    "raw",
    "benchmarks",
    "weirdml.yaml",
  )
  await saveBenchmarkResults(outPath, results, costPerTask)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
