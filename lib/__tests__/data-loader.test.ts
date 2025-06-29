import { transformToTableData, type LLMData } from "../data-loader"
import { expect, test } from "vitest"

// Simple unit test for transformToTableData

test("transformToTableData converts LLMData objects to table rows", () => {
  const llms: LLMData[] = [
    { model: "Foo", provider: "Bar", benchmarks: {}, averageScore: 42 },
  ]

  const rows = transformToTableData(llms)
  expect(rows).toEqual([
    {
      id: "foo",
      model: "Foo",
      provider: "Bar",
      averageScore: 42,
      costPerTask: null,
    },
  ])
})
