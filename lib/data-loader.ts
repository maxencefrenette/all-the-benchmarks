import { parse } from "yaml"
import fs from "fs/promises"
import path from "path"

export interface BenchmarkResult {
  score: number
  description: string
  costPerTask?: number
}

export interface LLMData {
  model: string
  provider: string
  benchmarks: Record<string, BenchmarkResult>
  averageScore?: number
  averageCost?: number
  costScore?: number
}

export interface TableRow {
  id: string
  model: string
  provider: string
  averageScore: number
  costPerTask: number | null
}

export async function loadLLMData(): Promise<LLMData[]> {
  const modelDir = path.join(process.cwd(), "public", "data", "models")
  const benchmarkDir = path.join(process.cwd(), "public", "data", "benchmarks")

  const modelSlugs = (await fs.readdir(modelDir))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))

  const benchmarkSlugs = (await fs.readdir(benchmarkDir))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
  const llmMap: Record<string, LLMData> = {}
  const aliasMap: Record<string, string> = {}

  for (const slug of modelSlugs) {
    try {
      const filePath = path.join(modelDir, `${slug}.yaml`)
      const text = await fs.readFile(filePath, "utf8")
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
      const filePath = path.join(benchmarkDir, `${slug}.yaml`)
      const text = await fs.readFile(filePath, "utf8")
      const data = parse(text) as {
        benchmark: string
        description: string
        results: Record<string, number>
        cost_per_task?: Record<string, number>
      }
      if (!data.benchmark || !data.results) {
        throw new Error(`Invalid benchmark structure for ${slug}`)
      }
      const costMap = data.cost_per_task || {}
      for (const [rawName, score] of Object.entries(data.results)) {
        const mappedSlug = aliasMap[rawName] || rawName
        const llm = llmMap[mappedSlug]
        if (llm) {
          llm.benchmarks[data.benchmark] = {
            score: Number(score),
            description: data.description,
            ...(costMap[rawName] && costMap[rawName] > 0
              ? { costPerTask: Number(costMap[rawName]) }
              : {}),
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load benchmark data for ${slug}:`, error)
    }
  }

  // Determine the min and max score for each benchmark across all models
  const benchmarkStats: Record<string, { min: number; max: number }> = {}
  for (const llm of Object.values(llmMap)) {
    for (const [name, result] of Object.entries(llm.benchmarks)) {
      const stats = benchmarkStats[name] ?? {
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      }
      stats.min = Math.min(stats.min, result.score)
      stats.max = Math.max(stats.max, result.score)
      benchmarkStats[name] = stats
    }
  }

  // Compute each model's average using min-max normalised scores
  const results = Object.values(llmMap).map((llm) => {
    const normalised = Object.entries(llm.benchmarks).map(([name, result]) => {
      const { min, max } = benchmarkStats[name]
      if (max === min) return 1
      return (result.score - min) / (max - min)
    })
    llm.averageScore =
      (normalised.reduce((sum, score) => sum + score, 0) /
        (normalised.length || 1)) *
      100
    const costs = Object.values(llm.benchmarks)
      .map((r) => r.costPerTask)
      .filter((c): c is number => typeof c === "number")
    if (costs.length > 0) {
      llm.averageCost = costs.reduce((sum, c) => sum + c, 0) / costs.length
    }
    return llm
  })

  const costValues = results
    .map((l) => l.averageCost)
    .filter((c): c is number => typeof c === "number")

  if (costValues.length > 0) {
    const mean = costValues.reduce((s, c) => s + c, 0) / costValues.length
    const std = Math.sqrt(
      costValues.reduce((s, c) => s + (c - mean) ** 2, 0) / costValues.length,
    )
    if (std > 0) {
      for (const llm of results) {
        if (typeof llm.averageCost === "number") {
          llm.costScore = (llm.averageCost - mean) / std
        }
      }
    }
  }

  return results.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
}

export function transformToTableData(llmData: LLMData[]): TableRow[] {
  return llmData.map((llm) => ({
    id: llm.model.toLowerCase().replace(/\s+/g, "-"),
    model: llm.model,
    provider: llm.provider,
    averageScore: llm.averageScore || 0,
    costPerTask: llm.costScore ?? null,
  }))
}
