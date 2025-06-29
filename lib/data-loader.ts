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
  averageScore: number
}

export async function loadLLMData(): Promise<LLMData[]> {
  const modelSlugs = [
    "o3-high",
    "o3-medium",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "claude-opus-4",
    "claude-sonnet-4",
  ]

  const benchmarkSlugs = [
    "livebench",
    "simplebench",
    "lmarena-text",
    "arc-agi-1",
    "aider-polyglot",
    "humanitys-last-exam",
  ]
  const llmMap: Record<string, LLMData> = {}
  const aliasMap: Record<string, string> = {}

  for (const slug of modelSlugs) {
    try {
      const response = await fetch(`/data/models/${slug}.yaml`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${slug}.yaml: ${response.status}`)
      }
      const text = await response.text()
      const data = parse(text) as {
        model: string
        provider: string
        aliases?: string[]
      }
      if (!data.model || !data.provider) {
        throw new Error(`Invalid data structure for ${slug}`)
      }
      llmMap[slug] = {
        model: data.model,
        provider: data.provider,
        benchmarks: {},
      }
      aliasMap[data.model] = slug
      for (const alias of data.aliases || []) {
        aliasMap[alias] = slug
      }
    } catch (error) {
      console.error(`Failed to load model data for ${slug}:`, error)
    }
  }

  for (const slug of benchmarkSlugs) {
    try {
      const response = await fetch(`/data/benchmarks/${slug}.yaml`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${slug}.yaml: ${response.status}`)
      }
      const text = await response.text()
      const data = parse(text) as {
        benchmark: string
        description: string
        results: Record<string, number>
      }
      if (!data.benchmark || !data.results) {
        throw new Error(`Invalid benchmark structure for ${slug}`)
      }
      for (const [rawName, score] of Object.entries(data.results)) {
        const mappedSlug = aliasMap[rawName] || rawName
        const llm = llmMap[mappedSlug]
        if (llm) {
          llm.benchmarks[data.benchmark] = {
            score: Number(score),
            description: data.description,
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load benchmark data for ${slug}:`, error)
    }
  }

  const results = Object.values(llmMap).map((llm) => {
    const entries = Object.values(llm.benchmarks)
    const scores = entries.map((b) => b.score)
    llm.averageScore =
      scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1)
    return llm
  })

  return results.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
}

export function transformToTableData(llmData: LLMData[]): TableRow[] {
  return llmData.map((llm) => ({
    id: llm.model.toLowerCase().replace(/\s+/g, "-"),
    model: llm.model,
    provider: llm.provider,
    averageScore: llm.averageScore || 0,
  }))
}
