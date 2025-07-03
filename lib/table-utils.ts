export interface TableRow {
  id: string
  slug: string
  model: string
  provider: string
  averageScore: number
  costPerTask: number | null
  benchmarks: string[]
}

export function transformToTableData(
  llmData: {
    slug: string
    model: string
    provider: string
    averageScore?: number
    normalizedCost?: number | null
    benchmarks?: Record<string, unknown>
  }[],
): TableRow[] {
  return llmData.map((llm) => ({
    id: llm.slug,
    slug: llm.slug,
    model: llm.model,
    provider: llm.provider,
    averageScore: llm.averageScore || 0,
    costPerTask: llm.normalizedCost ?? null,
    benchmarks: llm.benchmarks ? Object.keys(llm.benchmarks) : [],
  }))
}
