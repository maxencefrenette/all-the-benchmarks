import { execSync } from "child_process"
import fs from "fs/promises"
import path from "path"
import YAML from "yaml"
import { chromium } from "playwright"
import {
  BenchmarkFileSchema,
  MappingFileSchema,
  type BenchmarkFile,
} from "../lib/yaml-schemas"

export function curl(url: string): string {
  return execSync(`curl -sL ${url}`, { encoding: "utf8" })
}

/**
 * Update the benchmark YAML file with new results.
 *
 * Only the `results` and `cost_per_task` sections are modified. All other
 * keys remain untouched so manual edits are preserved.
 */
export async function saveBenchmarkResults(
  outPath: string,
  results: Record<string, number>,
  costPerTask?: Record<string, number>,
): Promise<void> {
  let yamlObj: Partial<BenchmarkFile> = {}
  try {
    const existing = await fs.readFile(outPath, "utf8")
    yamlObj = BenchmarkFileSchema.partial().parse(YAML.parse(existing))
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err
  }

  const existingResults = yamlObj.results as Record<string, number> | undefined
  const existingCosts = yamlObj.cost_per_task as
    | Record<string, number>
    | undefined
  const resultsEmpty = !results || Object.keys(results).length === 0
  const costsEmpty =
    costPerTask === undefined || Object.keys(costPerTask).length === 0

  if (
    (resultsEmpty &&
      existingResults &&
      Object.keys(existingResults).length > 0) ||
    (costsEmpty && existingCosts && Object.keys(existingCosts).length > 0)
  ) {
    console.warn(`Skipping update for ${outPath} because new data is empty`)
    return
  }

  yamlObj.results = results
  if (costPerTask && Object.keys(costPerTask).length > 0) {
    yamlObj.cost_per_task = costPerTask
  } else {
    delete yamlObj.cost_per_task
  }

  const existingMap: Record<string, string | null> = {}
  const mapPath = path.join(
    path.dirname(outPath),
    "..",
    "mappings",
    yamlObj.model_name_mapping_file as string,
  )
  try {
    const mapText = await fs.readFile(mapPath, "utf8")
    Object.assign(existingMap, MappingFileSchema.parse(YAML.parse(mapText)))
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err
  }

  const sortedModels = Object.keys(results).sort((a, b) => a.localeCompare(b))
  const newMap: Record<string, string | null> = {}
  for (const name of sortedModels) {
    newMap[name] = Object.prototype.hasOwnProperty.call(existingMap, name)
      ? existingMap[name]
      : null
  }
  await fs.writeFile(mapPath, YAML.stringify(newMap))
  delete yamlObj.model_name_mapping

  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

export interface ArtificialAnalysisOptions {
  url: string
  resultsSelector: string
  costSelector: string
  filterRegex?: RegExp
}

export async function scrapeArtificialAnalysisBenchmark(
  options: ArtificialAnalysisOptions,
): Promise<{
  results: Record<string, number>
  costPerTask: Record<string, number>
}> {
  const {
    url,
    resultsSelector,
    costSelector,
    filterRegex = /\d+ of \d+ models selected/,
  } = options
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()

  try {
    await page.goto(url)
    await page.waitForLoadState("networkidle")

    const filterButton = await page
      .getByText(filterRegex, { exact: true })
      .nth(0)
    await filterButton.click()

    const opts = await page.$$("div[role='option'][aria-selected='false']")
    for (const o of opts) {
      await o.click()
    }

    async function collect(
      selector: string,
      parse: (t: string) => number,
    ): Promise<{ names: string[]; values: number[] }> {
      const container = await page.locator(selector)
      const svg = await container.locator("svg[role='img']").first()
      const outer = await svg.locator("g").first()
      const namesGroup = await outer.locator("> g").nth(-3)
      const nameNodes = await namesGroup.locator("text").all()
      const names = await Promise.all(
        nameNodes.map(async (n) =>
          (await n.locator("tspan").allTextContents()).join(" ").trim(),
        ),
      )
      const valuesGroup = await outer.locator("> g").nth(-2)
      const texts = await valuesGroup.locator("text").allTextContents()
      const values = texts.map(parse)
      return { names, values }
    }

    const scoreData = await collect(resultsSelector, (t) => parseInt(t))
    const costData = await collect(costSelector, (t) =>
      parseInt(t.replace(/,/g, "")),
    )

    const results: Record<string, number> = {}
    for (let i = 0; i < scoreData.names.length; i++) {
      results[scoreData.names[i]] = scoreData.values[i]
    }

    const costPerTask: Record<string, number> = {}
    for (let i = 0; i < costData.names.length; i++) {
      costPerTask[costData.names[i]] = costData.values[i]
    }

    return { results, costPerTask }
  } finally {
    await browser.close()
  }
}
