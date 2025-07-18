import path from "path"
import { fileURLToPath } from "url"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Categories {
  [category: string]: string[]
}

interface Row {
  [column: string]: string
}

function getLatestDate(): string {
  const json = JSON.parse(
    curl(
      "https://api.github.com/repos/LiveBench/livebench.github.io/contents?ref=gh-pages",
    ),
  ) as Array<{ name: string }>
  const dates = json
    .filter((f) => f.name.startsWith("table_") && f.name.endsWith(".csv"))
    .map((f) => f.name.match(/table_(\d{4}_\d{2}_\d{2})\.csv/))
    .filter(Boolean)
    .map((m) => (m as RegExpMatchArray)[1])
    .sort()
  if (!dates.length) throw new Error("No table files found")
  return dates[dates.length - 1]
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

function computeGlobalAverage(row: Row, categories: Categories): number {
  const categoryAverages = Object.values(categories).map((cols) => {
    const vals = cols.map((c) => parseFloat(row[c])).filter((v) => !isNaN(v))
    return vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
  })
  return (
    categoryAverages.reduce((a, b) => a + b, 0) / (categoryAverages.length || 1)
  )
}

async function main(): Promise<void> {
  const date = getLatestDate()
  const csv = curl(
    `https://raw.githubusercontent.com/LiveBench/livebench.github.io/gh-pages/table_${date}.csv`,
  )
  const categoriesText = curl(
    `https://raw.githubusercontent.com/LiveBench/livebench.github.io/gh-pages/categories_${date}.json`,
  )
  const categories: Categories = JSON.parse(categoriesText)
  const rows = parseCSV(csv)
  const rawResults: Record<string, number> = {}
  for (const row of rows) {
    const avg = computeGlobalAverage(row, categories)
    rawResults[row.model] = Math.round(avg * 100) / 100
  }

  const results: Record<string, number> = {}
  for (const [name, score] of Object.entries(rawResults)) {
    results[name] = score
  }
  const outPath = path.join(
    __dirname,
    "..",
    "data",
    "raw",
    "benchmarks",
    "livebench.yaml",
  )
  await saveBenchmarkResults(outPath, results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
