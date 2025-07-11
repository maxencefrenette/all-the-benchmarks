import { loadLLMData } from "../data-loader"
import { expect, test } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { stringify } from "yaml"

test("adding non-overlapping cost benchmark does not change costs", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "benchtest-"))
  await fs.mkdir(path.join(tmp, "data", "models"), { recursive: true })
  await fs.mkdir(path.join(tmp, "data", "benchmarks"), { recursive: true })
  await fs.mkdir(path.join(tmp, "data", "mappings"), { recursive: true })

  const mappingPath = path.join(tmp, "data", "mappings", "test.yaml")
  const mapping = { A: "model-a", B: "model-b", C: "model-c", D: "model-d" }
  await fs.writeFile(mappingPath, stringify(mapping))

  const modelsPath = path.join(tmp, "data", "models", "models.yaml")
  await fs.writeFile(
    modelsPath,
    stringify({
      provider: "Test",
      reasoning_efforts: {
        "model-a": "A",
        "model-b": "B",
        "model-c": "C",
        "model-d": "D",
      },
    }),
  )

  const benchDir = path.join(tmp, "data", "benchmarks")
  async function writeBench(
    name: string,
    results: Record<string, number>,
    costs: Record<string, number>,
  ) {
    const filePath = path.join(benchDir, `${name}.yaml`)
    await fs.writeFile(
      filePath,
      stringify({
        benchmark: name,
        description: name,
        score_weight: 1,
        cost_weight: 1,
        results,
        model_name_mapping_file: "test.yaml",
        private_holdout: false,
        cost_per_task: costs,
      }),
    )
  }

  await writeBench("bench1", { A: 1, B: 2 }, { A: 0.1, B: 0.2 })
  await writeBench("bench2", { A: 2, B: 4 }, { A: 0.2, B: 0.4 })

  const cwd = process.cwd()
  process.chdir(tmp)
  try {
    const before = await loadLLMData()
    const costBeforeA = before.find((m) => m.slug === "model-a")?.normalizedCost
    const costBeforeB = before.find((m) => m.slug === "model-b")?.normalizedCost

    await writeBench("bench3", { C: 3, D: 6 }, { C: 0.5, D: 0.7 })

    const after = await loadLLMData()
    const costAfterA = after.find((m) => m.slug === "model-a")?.normalizedCost
    const costAfterB = after.find((m) => m.slug === "model-b")?.normalizedCost

    expect(costAfterA).toBeCloseTo(costBeforeA ?? 0, 6)
    expect(costAfterB).toBeCloseTo(costBeforeB ?? 0, 6)
  } finally {
    process.chdir(cwd)
  }
})
