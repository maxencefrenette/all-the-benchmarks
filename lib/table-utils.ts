import type { BenchmarkResult } from "./data-loader"

export interface TableRow {
  id: string
  slug: string
  model: string
  provider: string
  averageScore: number
  costPerTask: number | null
  costBenchmarkCount: number
  benchmarkCount: number
  totalBenchmarks: number
  totalCostBenchmarks: number
}

export function transformToTableData(
  llmData: {
    slug: string
    model: string
    provider: string
    benchmarks: Record<string, unknown>
    averageScore?: number
    normalizedCost?: number | null
  }[],
): TableRow[] {
  const benchmarkWeights: Record<string, number> = {}
  const costBenchmarkWeights: Record<string, number> = {}
  for (const llm of llmData) {
    for (const [name, bench] of Object.entries(llm.benchmarks)) {
      const res = bench as BenchmarkResult
      benchmarkWeights[name] = res.scoreWeight
      if (res.normalizedCost !== undefined) {
        costBenchmarkWeights[name] = res.costWeight
      }
    }
  }
  const totalBenchmarks = Object.values(benchmarkWeights).reduce(
    (s, w) => s + w,
    0,
  )
  const totalCostBenchmarks = Object.values(costBenchmarkWeights).reduce(
    (s, w) => s + w,
    0,
  )

  return llmData.map((llm) => ({
    id: llm.slug,
    slug: llm.slug,
    model: llm.model,
    provider: llm.provider,
    averageScore: llm.averageScore || 0,
    costPerTask: llm.normalizedCost ?? null,
    costBenchmarkCount: Object.values(llm.benchmarks).reduce((s, b) => {
      const res = b as BenchmarkResult
      return res.normalizedCost !== undefined ? s + res.costWeight : s
    }, 0),
    benchmarkCount: Object.values(llm.benchmarks).reduce((s, b) => {
      const res = b as BenchmarkResult
      return s + res.scoreWeight
    }, 0),
    totalBenchmarks,
    totalCostBenchmarks,
  }))
}
