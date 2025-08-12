import { parse } from "yaml"
import fs from "fs/promises"
import path from "path"
import { type TableRow, transformToTableData } from "./table-utils"
import {
  BenchmarkFileSchema,
  ModelFileSchema,
  ProcessedBenchmarkFileSchema,
} from "./yaml-schemas"
import { ABILITY_SIGMOID } from "./settings"

export interface BenchmarkResult {
  score: number
  normalizedScore?: number
  description: string
  costPerTask?: number
  normalizedCost?: number
  scoreWeight: number
  costWeight: number
}

export interface LLMData {
  slug: string
  model: string
  provider: string
  modelSlug: string
  reasoningOrder: number
  deprecated?: boolean
  releaseDate?: Date
  benchmarks: Record<string, BenchmarkResult>
  ability?: number
  averageScore?: number
  normalizedCost?: number
}

/**
 * Load benchmark and model metadata from YAML files on disk.
 *
 * The returned array is sorted in descending order by average benchmark score
 * and contains normalized cost information when available.
 */
export async function loadLLMData(): Promise<LLMData[]> {
  const modelDir = path.join(process.cwd(), "data", "config", "models")
  const benchmarkDir = path.join(process.cwd(), "data", "raw", "benchmarks")
  const processedDir = path.join(
    process.cwd(),
    "data",
    "processed",
    "benchmarks",
  )
  const abilityPath = path.join(
    process.cwd(),
    "data",
    "processed",
    "model_abilities.yaml",
  )

  const modelFiles = (await fs.readdir(modelDir)).filter((f) =>
    f.endsWith(".yaml"),
  )

  const benchmarkSlugs = (await fs.readdir(benchmarkDir))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))
  const llmMap: Record<string, LLMData> = {}

  let abilityMap: Record<string, number> = {}
  try {
    const abilityText = await fs.readFile(abilityPath, "utf8")
    abilityMap = parse(abilityText) as Record<string, number>
  } catch {
    abilityMap = {}
  }

  for (const file of modelFiles) {
    try {
      const filePath = path.join(modelDir, file)
      const text = await fs.readFile(filePath, "utf8")
      const data = ModelFileSchema.parse(parse(text))
      const modelSlug = file.replace(/\.yaml$/, "")
      Object.entries(data.reasoning_efforts).forEach(([slug, name], index) => {
        llmMap[slug] = {
          slug,
          model: name,
          provider: data.provider,
          modelSlug,
          reasoningOrder: index,
          ...(data.deprecated ? { deprecated: true } : {}),
          ...(data.release_date ? { releaseDate: data.release_date } : {}),
          benchmarks: {},
        }
      })
    } catch (error) {
      console.error(`Failed to load model data for ${file}:`, error)
    }
  }

  for (const slug of benchmarkSlugs) {
    try {
      const filePath = path.join(benchmarkDir, `${slug}.yaml`)
      const text = await fs.readFile(filePath, "utf8")
      const data = BenchmarkFileSchema.parse(parse(text))
      const procPath = path.join(processedDir, `${slug}.yaml`)
      const procText = await fs.readFile(procPath, "utf8")
      const results = ProcessedBenchmarkFileSchema.parse(parse(procText))
      for (const [modelSlug, result] of Object.entries(results)) {
        if (modelSlug === "sigmoid") continue
        const llm = llmMap[modelSlug]
        if (!llm) continue
        const hasCost = result.cost !== undefined && result.cost > 0
        const normalized =
          result.normalized_cost !== undefined
            ? Number(result.normalized_cost)
            : undefined
        const normScore =
          result.normalized_score !== undefined
            ? Number(result.normalized_score)
            : undefined
        llm.benchmarks[data.benchmark] = {
          score: Number(result.score),
          description: data.description,
          ...(hasCost ? { costPerTask: Number(result.cost) } : {}),
          ...(normalized !== undefined ? { normalizedCost: normalized } : {}),
          ...(normScore !== undefined ? { normalizedScore: normScore } : {}),
          scoreWeight: data.score_weight,
          costWeight: data.cost_weight,
        }
      }
    } catch (error) {
      console.error(`Failed to load benchmark data for ${slug}:`, error)
    }
  }

  const results = Object.values(llmMap)

  for (const llm of results) {
    const ability = abilityMap[llm.slug]
    if (ability !== undefined) {
      llm.ability = ability
      const { min, max, midpoint, slope } = ABILITY_SIGMOID
      llm.averageScore =
        min + (max - min) / (1 + Math.exp(-(ability - midpoint) / slope))
    }
    const costs: { value: number; weight: number }[] = []
    for (const res of Object.values(llm.benchmarks)) {
      if (res.normalizedCost !== undefined) {
        costs.push({ value: res.normalizedCost, weight: res.costWeight })
      }
    }
    if (costs.length > 0) {
      const totalWeight = costs.reduce((s, c) => s + c.weight, 0)
      llm.normalizedCost =
        costs.reduce((s, c) => s + c.value * c.weight, 0) / (totalWeight || 1)
    }
  }

  return results.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
}

/**
 * Retrieve the details for a single language model by its slug.
 *
 * @param slug The identifier used in the YAML configuration files.
 * @returns The matching {@link LLMData} or `null` if it is not found.
 */
export async function loadLLMDetails(slug: string): Promise<LLMData | null> {
  const all = await loadLLMData()
  return all.find((m) => m.slug === slug) ?? null
}

export { transformToTableData }
export type { TableRow }
