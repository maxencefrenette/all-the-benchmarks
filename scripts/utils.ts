import { execSync } from "child_process"
import fs from "fs/promises"
import path from "path"
import YAML from "yaml"
import { BenchmarkFileSchema, type BenchmarkFile } from "../lib/yaml-schemas"

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

  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}
