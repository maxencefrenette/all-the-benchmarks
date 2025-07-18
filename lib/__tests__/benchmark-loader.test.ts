import { loadBenchmarks } from "../benchmark-loader"
import { expect, test } from "vitest"

// Ensure benchmark names come back alphabetically sorted
// using the real data under data/raw/benchmarks

test("loadBenchmarks returns sorted benchmarks", async () => {
  const benchmarks = await loadBenchmarks()
  expect(benchmarks.length).toBeGreaterThan(0)
  const names = benchmarks.map((b) => b.benchmark)
  const sorted = [...names].sort((a, b) => a.localeCompare(b))
  expect(names).toEqual(sorted)
  expect(benchmarks[0].modelCount).toBeGreaterThan(0)
  expect(typeof benchmarks[0].hasCost).toBe("boolean")
  expect(typeof benchmarks[0].privateHoldout).toBe("boolean")
  expect(typeof benchmarks[0].scoreWeight).toBe("number")
  expect(typeof benchmarks[0].costWeight).toBe("number")
})
