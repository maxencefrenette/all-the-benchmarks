import { parse } from "yaml"
import fs from "fs/promises"
import path from "path"
import { type TableRow, transformToTableData } from "./table-utils"

export interface BenchmarkResult {
  score: number
  normalizedScore?: number
  description: string
  costPerTask?: number
  normalizedCost?: number
}

export interface LLMData {
  slug: string
  model: string
  provider: string
  deprecated?: boolean
  benchmarks: Record<string, BenchmarkResult>
  averageScore?: number
  normalizedCost?: number
}

export async function loadLLMData(): Promise<LLMData[]> {
  const modelDir = path.join(process.cwd(), "data", "models")
  const benchmarkDir = path.join(process.cwd(), "data", "benchmarks")

  const modelSlugs = (await fs.readdir(modelDir))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))

  const benchmarkSlugs = (await fs.readdir(benchmarkDir))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
  const llmMap: Record<string, LLMData> = {}
  const aliasMap: Record<string, string> = {}
  const benchmarkCostMap: Record<string, Record<string, number>> = {}

  for (const slug of modelSlugs) {
    try {
      const filePath = path.join(modelDir, `${slug}.yaml`)
      const text = await fs.readFile(filePath, "utf8")
      const data = parse(text) as {
        model: string
        provider: string
        deprecated?: boolean
      }
      if (!data.model || !data.provider) {
        throw new Error(`Invalid data structure for ${slug}`)
      }
      llmMap[slug] = {
        slug,
        model: data.model,
        provider: data.provider,
        ...(data.deprecated ? { deprecated: true } : {}),
        benchmarks: {},
      }
      aliasMap[data.model] = slug
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
        model_name_mapping_file: string
      }
      if (!data.benchmark || !data.results) {
        throw new Error(`Invalid benchmark structure for ${slug}`)
      }
      let mapping: Record<string, string | null> | undefined
      try {
        const mapPath = path.join(
          process.cwd(),
          "data",
          "mappings",
          data.model_name_mapping_file,
        )
        const mapText = await fs.readFile(mapPath, "utf8")
        const fileMap = parse(mapText) as Record<string, string | null>
        mapping = fileMap
      } catch (err) {
        console.error(
          `Failed to load model_name_mapping_file for ${slug}:`,
          err,
        )
      }

      if (mapping) {
        for (const [alias, slugName] of Object.entries(mapping)) {
          if (slugName) aliasMap[alias] = slugName
        }
      }
      const costMap = data.cost_per_task || {}
      for (const [rawName, score] of Object.entries(data.results)) {
        const mappedSlug = aliasMap[rawName] || rawName
        const llm = llmMap[mappedSlug]
        if (llm) {
          const hasCost = costMap[rawName] && costMap[rawName] > 0
          llm.benchmarks[data.benchmark] = {
            score: Number(score),
            description: data.description,
            ...(hasCost ? { costPerTask: Number(costMap[rawName]) } : {}),
          }
          if (hasCost) {
            if (!benchmarkCostMap[data.benchmark]) {
              benchmarkCostMap[data.benchmark] = {}
            }
            benchmarkCostMap[data.benchmark][mappedSlug] = Number(
              costMap[rawName],
            )
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
      let value = 1
      if (max !== min) {
        value = (result.score - min) / (max - min)
      }
      result.normalizedScore = value * 100
      return value
    })
    llm.averageScore =
      (normalised.reduce((sum, score) => sum + score, 0) /
        (normalised.length || 1)) *
      100
    return llm
  })

  // compute normalization factors for benchmark costs
  const costBenchmarks = Object.keys(benchmarkCostMap)
  let intersection = new Set<string>()
  if (costBenchmarks.length > 0) {
    intersection = new Set(Object.keys(benchmarkCostMap[costBenchmarks[0]]))
    for (const b of costBenchmarks.slice(1)) {
      intersection = new Set(
        [...intersection].filter((m) => benchmarkCostMap[b][m] !== undefined),
      )
    }
  }

  const normalizationFactors: Record<string, number> = {}
  if (intersection.size > 0) {
    for (const b of costBenchmarks) {
      const values = [...intersection].map((m) => benchmarkCostMap[b][m])
      const mean = values.reduce((sum, c) => sum + c, 0) / (values.length || 1)
      if (mean > 0) {
        normalizationFactors[b] = 1 / mean
      }
    }
  }

  // apply normalization factors and compute per-model averages
  for (const llm of results) {
    const costs: number[] = []
    for (const [b, res] of Object.entries(llm.benchmarks)) {
      const factor = normalizationFactors[b]
      if (res.costPerTask && factor) {
        res.normalizedCost = res.costPerTask * factor
        costs.push(res.normalizedCost)
      }
    }
    if (costs.length > 0) {
      llm.normalizedCost = costs.reduce((s, c) => s + c, 0) / costs.length
    }
  }

  return results.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
}

export async function loadLLMDetails(slug: string): Promise<LLMData | null> {
  const all = await loadLLMData()
  return all.find((m) => m.slug === slug) ?? null
}

export { transformToTableData }
export type { TableRow }
