export interface BenchmarkResult {
  score: number
  description: string
}

export interface LLMData {
  model: string
  provider: string
  benchmarks: Record<string, BenchmarkResult>
  averageScore?: number
}

export interface TableRow {
  id: string
  model: string
  provider: string
  mmlu: number
  hellaswag: number
  arc: number
  averageScore: number
}

export async function loadLLMData(): Promise<LLMData[]> {
  const models = ["gpt-4", "claude-3", "gemini-pro"]
  const results: LLMData[] = []

  for (const model of models) {
    try {
      const response = await fetch(`/data/${model}.json`)

      if (!response.ok) {
        throw new Error(`Failed to fetch ${model}.json: ${response.status}`)
      }

      const data = (await response.json()) as LLMData

      // Validate that we have the expected structure
      if (!data.model || !data.provider || !data.benchmarks) {
        throw new Error(`Invalid data structure for ${model}`)
      }

      // Calculate average score
      const benchmarkEntries = Object.values(data.benchmarks)
      if (benchmarkEntries.length === 0) {
        throw new Error(`No benchmarks found for ${model}`)
      }

      const scores = benchmarkEntries.map((b) => b.score).filter((score) => typeof score === "number")
      data.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

      results.push(data)
    } catch (error) {
      console.error(`Failed to load data for ${model}:`, error)
    }
  }

  // Sort by average score (descending)
  return results.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
}

export function transformToTableData(llmData: LLMData[]): TableRow[] {
  return llmData.map((llm) => ({
    id: llm.model.toLowerCase().replace(/\s+/g, "-"),
    model: llm.model,
    provider: llm.provider,
    mmlu: llm.benchmarks.MMLU?.score || 0,
    hellaswag: llm.benchmarks.HellaSwag?.score || 0,
    arc: llm.benchmarks.ARC?.score || 0,
    averageScore: llm.averageScore || 0,
  }))
}
