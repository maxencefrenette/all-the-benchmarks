import { loadLLMData } from "../data-loader"
import { expect, test } from "vitest"
import fs from "fs/promises"
import path from "path"
import os from "os"
import { stringify } from "yaml"

// Regression test ensuring benchmark results are only matched via explicit mappings

test("loadLLMData ignores unmapped slugs", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "mapping-"))
  await fs.mkdir(path.join(tmp, "data", "models"), { recursive: true })
  await fs.mkdir(path.join(tmp, "data", "benchmarks"), { recursive: true })
  await fs.mkdir(path.join(tmp, "data", "mappings"), { recursive: true })

  await fs.writeFile(
    path.join(tmp, "data", "models", "model.yaml"),
    stringify({
      provider: "Test",
      reasoning_efforts: { "model-a": "Model A" },
    }),
  )

  await fs.writeFile(
    path.join(tmp, "data", "mappings", "map.yaml"),
    stringify({ A: "model-a" }),
  )

  await fs.writeFile(
    path.join(tmp, "data", "benchmarks", "bench.yaml"),
    stringify({
      benchmark: "bench",
      description: "bench",
      score_weight: 1,
      cost_weight: 1,
      results: { A: 1, "model-a": 2 },
      model_name_mapping_file: "map.yaml",
      private_holdout: false,
    }),
  )

  await fs.writeFile(
    path.join(tmp, "data", "benchmarks", "other.yaml"),
    stringify({
      benchmark: "other",
      description: "other",
      score_weight: 1,
      cost_weight: 1,
      results: { "model-a": 5 },
      model_name_mapping_file: "map.yaml",
      private_holdout: false,
    }),
  )

  const cwd = process.cwd()
  process.chdir(tmp)
  try {
    const llms = await loadLLMData()
    const model = llms.find((m) => m.slug === "model-a")
    expect(model?.benchmarks["bench"]?.score).toBe(1)
    expect(model?.benchmarks["other"]?.score).toBeUndefined()
  } finally {
    process.chdir(cwd)
  }
})
