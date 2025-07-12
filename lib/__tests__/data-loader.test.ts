import { loadLLMData, type LLMData } from "../data-loader"
import { transformToTableData } from "../table-utils"
import { expect, test } from "vitest"

// Simple unit test for transformToTableData

test("transformToTableData converts LLMData objects to table rows", () => {
  const llms: LLMData[] = [
    {
      slug: "foo",
      model: "Foo",
      provider: "Bar",
      modelSlug: "foo-model",
      reasoningOrder: 0,
      benchmarks: {},
      averageScore: 42,
    },
  ]

  const rows = transformToTableData(llms)
  expect(rows).toEqual([
    {
      id: "foo",
      slug: "foo",
      model: "Foo",
      provider: "Bar",
      averageScore: 42,
      costPerTask: null,
      costBenchmarkCount: 0,
      benchmarkCount: 0,
      totalBenchmarks: 0,
      totalCostBenchmarks: 0,
    },
  ])
})

test("loadLLMData returns sorted results", async () => {
  const llmData = await loadLLMData()

  // should return some data
  expect(llmData.length).toBeGreaterThan(0)

  // results must be sorted by averageScore descending
  const scores = llmData.map((d) => d.averageScore || 0)
  const sorted = [...scores].sort((a, b) => b - a)
  expect(scores).toEqual(sorted)

  // ensure at least one known model is loaded
  const grok = llmData.find((d) => d.slug === "grok-3")
  expect(grok).toBeDefined()
  expect(grok?.benchmarks["LMArena Text"]).toBeDefined()
})

test("loadLLMData marks deprecated models", async () => {
  const llmData = await loadLLMData()
  const deprecated = llmData.find((d) => d.slug === "deepseek-r1-0120")
  expect(deprecated?.deprecated).toBe(true)
})

test("loadLLMData parses release dates", async () => {
  const llmData = await loadLLMData()
  const grok4 = llmData.find((d) => d.slug === "grok-4")
  expect(grok4?.releaseDate).toEqual(new Date("2025-07-09"))
})
