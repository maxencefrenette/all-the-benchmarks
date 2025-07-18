import { saveBenchmarkResults } from "../utils"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { stringify } from "yaml"
import YAML from "yaml"
import { expect, test, vi } from "vitest"

async function setupFile() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "savebench-"))
  await fs.mkdir(path.join(tmp, "data", "raw", "benchmarks"), {
    recursive: true,
  })
  await fs.mkdir(path.join(tmp, "data", "config", "mappings"), {
    recursive: true,
  })
  const benchPath = path.join(tmp, "data", "raw", "benchmarks", "test.yaml")
  const mapPath = path.join(tmp, "data", "config", "mappings", "map.yaml")
  await fs.writeFile(
    benchPath,
    stringify({
      benchmark: "test",
      description: "test",
      score_weight: 1,
      cost_weight: 1,
      results: { A: 1 },
      model_name_mapping_file: "map.yaml",
      cost_per_task: { A: 0.1 },
    }),
  )
  await fs.writeFile(mapPath, stringify({ A: null }))
  return { tmp, benchPath }
}

test("does not overwrite scores with empty object", async () => {
  const { tmp, benchPath } = await setupFile()
  const cwd = process.cwd()
  process.chdir(tmp)
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  try {
    await saveBenchmarkResults(benchPath, {})
    const contents = await fs.readFile(benchPath, "utf8")
    const data = YAML.parse(contents)
    expect(Object.keys(data.results)).toEqual(["A"]) // unchanged
    expect(warn).toHaveBeenCalled()
  } finally {
    process.chdir(cwd)
    warn.mockRestore()
  }
})

test("does not overwrite costs with empty object", async () => {
  const { tmp, benchPath } = await setupFile()
  const cwd = process.cwd()
  process.chdir(tmp)
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  try {
    await saveBenchmarkResults(benchPath, { A: 2 }, {})
    const contents = await fs.readFile(benchPath, "utf8")
    const data = YAML.parse(contents)
    expect(data.cost_per_task.A).toBe(0.1) // unchanged
    expect(data.results.A).toBe(1) // no update either
    expect(warn).toHaveBeenCalled()
  } finally {
    process.chdir(cwd)
    warn.mockRestore()
  }
})
