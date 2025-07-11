import { loadBenchmarkDetails } from "../benchmark-loader"
import { expect, test } from "vitest"

test("loadBenchmarkDetails returns data for a benchmark", async () => {
  const details = await loadBenchmarkDetails("arc-agi-1")
  expect(details).not.toBeNull()
  expect(details?.benchmark).toBe("ARC-AGI-1")
  expect(Object.keys(details?.results ?? {}).length).toBeGreaterThan(0)
  expect(typeof details?.privateHoldout).toBe("boolean")
})
