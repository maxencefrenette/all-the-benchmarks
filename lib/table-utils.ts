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
  const benchmarkSet = new Set<string>()
  for (const llm of llmData) {
    for (const b of Object.keys(llm.benchmarks)) {
      benchmarkSet.add(b)
    }
  }
  const totalBenchmarks = benchmarkSet.size

  return llmData.map((llm) => ({
    id: llm.slug,
    slug: llm.slug,
    model: llm.model,
    provider: llm.provider,
    averageScore: llm.averageScore || 0,
    costPerTask: llm.normalizedCost ?? null,
    costBenchmarkCount: Object.values(llm.benchmarks).filter(
      (b) => (b as BenchmarkResult).normalizedCost !== undefined,
    ).length,
    benchmarkCount: Object.keys(llm.benchmarks).length,
    totalBenchmarks,
  }))
}
