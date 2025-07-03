export interface TableRow {
  id: string
  model: string
  provider: string
  averageScore: number
  costPerTask: number | null
}

export function transformToTableData(
  llmData: {
    model: string
    provider: string
    averageScore?: number
    normalizedCost?: number | null
  }[],
): TableRow[] {
  return llmData.map((llm) => ({
    id: llm.model.toLowerCase().replace(/\s+/g, "-"),
    model: llm.model,
    provider: llm.provider,
    averageScore: llm.averageScore || 0,
    costPerTask: llm.normalizedCost ?? null,
  }))
}
