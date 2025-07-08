import { execSync } from "child_process"
import fs from "fs/promises"
import path from "path"
import YAML from "yaml"

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
  let yamlObj: Record<string, unknown> = {}
  try {
    const existing = await fs.readFile(outPath, "utf8")
    yamlObj = YAML.parse(existing) as Record<string, unknown>
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err
  }

  yamlObj.results = results
  if (costPerTask && Object.keys(costPerTask).length > 0) {
    yamlObj.cost_per_task = costPerTask
  } else {
    delete yamlObj.cost_per_task
  }

  const existingMap: Record<string, string | null> = {}
  if (yamlObj.model_name_mapping_file) {
    const mapPath = path.join(
      path.dirname(outPath),
      "..",
      "mappings",
      yamlObj.model_name_mapping_file as string,
    )
    try {
      const mapText = await fs.readFile(mapPath, "utf8")
      Object.assign(
        existingMap,
        YAML.parse(mapText) as Record<string, string | null>,
      )
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err
    }
  }
  if (yamlObj.model_name_mapping) {
    Object.assign(
      existingMap,
      yamlObj.model_name_mapping as Record<string, string | null>,
    )
  }
  const sortedModels = Object.entries(results)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
  const newMap: Record<string, string | null> = {}
  for (const name of sortedModels) {
    newMap[name] = Object.prototype.hasOwnProperty.call(existingMap, name)
      ? existingMap[name]
      : null
  }
  if (!yamlObj.model_name_mapping_file || "model_name_mapping" in yamlObj) {
    yamlObj.model_name_mapping = newMap
  }

  if (yamlObj.model_name_mapping_file) {
    const mapPath = path.join(
      path.dirname(outPath),
      "..",
      "mappings",
      yamlObj.model_name_mapping_file as string,
    )
    await fs.writeFile(mapPath, YAML.stringify(newMap))
    console.log(`Wrote ${mapPath}`)
  }

  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}
