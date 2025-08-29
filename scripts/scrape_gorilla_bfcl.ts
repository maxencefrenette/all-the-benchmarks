import path from "path"
import { fileURLToPath } from "url"
import { chromium } from "playwright"
import { saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function scrapeGorillaBFCL() {
  const url = "https://gorilla.cs.berkeley.edu/leaderboard.html#leaderboard"
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle")

    // Heuristic: find the V4 leaderboard table by header names
    const tables = await page.locator("table").all()
    if (tables.length === 0) throw new Error("No tables found on page")

    const table = tables[0]

    // Use the last header row, which aligns with body columns
    const theadRows = await table.locator("thead tr").count()
    if (theadRows === 0) throw new Error("No header rows found")
    const headerTexts = await table
      .locator("thead tr")
      .nth(theadRows - 1)
      .locator("th")
      .allTextContents()
    const headersNorm = headerTexts.map((t) =>
      t.replace(/\s+/g, " ").trim().toLowerCase(),
    )
    const modelCol = headersNorm.findIndex((t) => t === "model")
    const overallCol = headersNorm.findIndex((t) => t === "overall acc")
    const costCol = headersNorm.findIndex((t) => t.startsWith("cost"))

    if (modelCol === -1 || overallCol === -1) {
      throw new Error("Missing required columns (model/overall accuracy)")
    }

    const rows = await table.locator("tbody tr").all()
    const results: Record<string, number> = {}
    const costPerTask: Record<string, number> = {}

    for (const row of rows) {
      const tds = await row.locator("td").allTextContents()
      if (!tds.length) continue
      const nameRaw = (tds[modelCol] || "").replace(/\s+/g, " ").trim()
      if (!nameRaw) continue
      const overallRaw = (tds[overallCol] || "").trim()
      const overall = parseFloat(overallRaw.replace(/[^0-9.\-]/g, ""))
      if (!isNaN(overall)) {
        results[nameRaw] = overall
      }
      if (costCol !== -1) {
        const costRaw = (tds[costCol] || "").trim()
        const cost = parseFloat(costRaw.replace(/[^0-9.\-]/g, ""))
        if (!isNaN(cost)) {
          costPerTask[nameRaw] = cost
        }
      }
    }

    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "raw",
      "benchmarks",
      "gorilla-bfcl.yaml",
    )

    // write minimal metadata + results/cost using helper
    await saveBenchmarkResults(outPath, results, costPerTask)
  } finally {
    await browser.close()
  }
}

async function ensureMetadata() {
  // When the file does not exist, saveBenchmarkResults creates it with just results.
  // We want to ensure static metadata fields are present as well.
  const fs = await import("fs/promises")
  const YAML = (await import("yaml")).default
  const outPath = path.join(
    __dirname,
    "..",
    "data",
    "raw",
    "benchmarks",
    "gorilla-bfcl.yaml",
  )
  let obj: any = {}
  try {
    obj = YAML.parse(await fs.readFile(outPath, "utf8")) || {}
  } catch (e) {
    // ignore
  }
  obj.benchmark = obj.benchmark ?? "Berkeley Function Call Leaderboard (BFCL)"
  obj.description =
    obj.description ?? "Overall accuracy on BFCL (function calling)"
  obj.website =
    obj.website ?? "https://gorilla.cs.berkeley.edu/leaderboard.html"
  obj.github = obj.github ?? null
  obj.score_weight = obj.score_weight ?? 1
  obj.cost_weight = obj.cost_weight ?? 1
  obj.model_name_mapping_file =
    obj.model_name_mapping_file ?? "gorilla-bfcl.yaml"
  obj.private_holdout = obj.private_holdout ?? true
  await fs.writeFile(outPath, YAML.stringify(obj), "utf8")
}

async function main() {
  await scrapeGorillaBFCL()
  await ensureMetadata()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
