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
    },
  ])
})

test("loadLLMData merges aliases and sorts results", async () => {
  const llmData = await loadLLMData()

  // should return some data
  expect(llmData.length).toBeGreaterThan(0)

  // results must be sorted by averageScore descending
  const scores = llmData.map((d) => d.averageScore || 0)
  const sorted = [...scores].sort((a, b) => b - a)
  expect(scores).toEqual(sorted)

  // aliases like `grok-3-preview-02-24` should map to `grok-3`
  const grok = llmData.find((d) => d.slug === "grok-3")
  expect(grok).toBeDefined()
  expect(grok?.benchmarks["LMArena Text"]).toBeDefined()
  const alias = llmData.find((d) => d.slug === "grok-3-preview-02-24")
  expect(alias).toBeUndefined()
})

test("loadLLMData marks deprecated models", async () => {
  const llmData = await loadLLMData()
  const deprecated = llmData.find((d) => d.slug === "deepseek-r1")
  expect(deprecated?.deprecated).toBe(true)
})
