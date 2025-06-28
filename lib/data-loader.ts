import { parse } from "yaml"

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
  const modelSlugs = ["gpt-4", "claude-3", "gemini-pro"]
  const benchmarkSlugs = ["mmlu", "hellaswag", "arc"]

  // Load model info first
  const models: Record<string, LLMData> = {}
  for (const slug of modelSlugs) {
    try {
      const res = await fetch(`/data/models/${slug}.yaml`)
      if (!res.ok) {
        throw new Error(`Failed to fetch models/${slug}.yaml: ${res.status}`)
      }
      const text = await res.text()
      const data = parse(text) as { model: string; provider: string }
      if (!data.model || !data.provider) {
        throw new Error(`Invalid model data for ${slug}`)
      }
      models[slug] = { model: data.model, provider: data.provider, benchmarks: {} }
    } catch (error) {
      console.error(`Failed to load model info for ${slug}:`, error)
    }
  }

  // Load benchmark results and populate the model objects
  for (const benchSlug of benchmarkSlugs) {
    try {
      const res = await fetch(`/data/benchmarks/${benchSlug}.yaml`)
      if (!res.ok) {
        throw new Error(`Failed to fetch benchmarks/${benchSlug}.yaml: ${res.status}`)
      }
      const text = await res.text()
      const data = parse(text) as {
        benchmark: string
        description: string
        results: Record<string, number>
      }

      if (!data.benchmark || !data.description || !data.results) {
        throw new Error(`Invalid benchmark data for ${benchSlug}`)
      }

      for (const slug of modelSlugs) {
        const model = models[slug]
        if (!model) continue
        const score = data.results[slug]
        if (typeof score === "number") {
          model.benchmarks[data.benchmark] = {
            score,
            description: data.description,
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load benchmark ${benchSlug}:`, error)
    }
  }

  const results: LLMData[] = []
  for (const slug of modelSlugs) {
    const model = models[slug]
    if (!model) continue
    const benchmarkEntries = Object.values(model.benchmarks)
    if (benchmarkEntries.length > 0) {
      const scores = benchmarkEntries.map((b) => b.score)
      model.averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
    }
    results.push(model)
  }

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
