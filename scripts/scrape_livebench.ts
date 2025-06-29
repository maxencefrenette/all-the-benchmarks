import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"
import YAML from "yaml"

interface Categories {
  [category: string]: string[]
}

interface Row {
  [column: string]: string
}

function curl(url: string): string {
  return execSync(`curl -sL ${url}`, { encoding: "utf8" })
}

function getLatestDate(): string {
  const json = JSON.parse(
    curl(
      "https://api.github.com/repos/LiveBench/livebench.github.io/contents/public",
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
    `https://raw.githubusercontent.com/LiveBench/livebench.github.io/main/public/table_${date}.csv`,
  )
  const categoriesText = curl(
    `https://raw.githubusercontent.com/LiveBench/livebench.github.io/main/public/categories_${date}.json`,
  )
  const categories: Categories = JSON.parse(categoriesText)
  const rows = parseCSV(csv)
  const results: Record<string, number> = {}
  for (const row of rows) {
    const avg = computeGlobalAverage(row, categories)
    results[row.model] = Math.round(avg * 100) / 100
  }
  const aliases: Record<string, string> = {
    "gpt-4": "gpt-4.5-preview-2025-02-27",
    "claude-3": "claude-4-opus-20250514-thinking-32k",
    "gemini-pro": "gemini-2.5-pro-preview-05-06",
  }
  for (const [slug, name] of Object.entries(aliases)) {
    if (results[name]) {
      results[slug] = results[name]
    }
  }
  const yamlObj = {
    benchmark: "LiveBench",
    description: "Average score across LiveBench categories",
    results,
  }
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "livebench.yaml",
  )
  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
