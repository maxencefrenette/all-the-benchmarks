import { execSync } from "child_process"
import fs from "fs/promises"
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

  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}
