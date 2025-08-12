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
  averageScore?: number
  normalizedCost?: number
  ability?: number
}

/**
 * Compute weighted average benchmark scores for each language model.
 *
 * Each model's normalized scores are multiplied by their benchmark-specific
 * weights to produce an overall average score. The `averageScore` field on
 * each {@link LLMData} entry is updated in place.
 */
export function computeAverageScores(
  llmMap: Record<string, LLMData>,
): LLMData[] {
  return Object.values(llmMap).map((llm) => {
    const weighted: { value: number; weight: number }[] = []
    for (const result of Object.values(llm.benchmarks)) {
      if (result.normalizedScore !== undefined) {
        weighted.push({
          value: result.normalizedScore / 100,
          weight: result.scoreWeight,
        })
      }
    }
    const totalWeight = weighted.reduce((s, n) => s + n.weight, 0)
    llm.averageScore =
      (weighted.reduce((sum, n) => sum + n.value * n.weight, 0) /
        (totalWeight || 1)) *
      100
    return llm
  })
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

  let abilities: Record<string, number> = {}
  try {
    const abilityText = await fs.readFile(abilityPath, "utf8")
    abilities = parse(abilityText) as Record<string, number>
    for (const [slug, val] of Object.entries(abilities)) {
      if (llmMap[slug]) llmMap[slug].ability = val
    }
  } catch (error) {
    console.error("Failed to load model abilities:", error)
  }

  for (const slug of benchmarkSlugs) {
    try {
      const filePath = path.join(benchmarkDir, `${slug}.yaml`)
      const text = await fs.readFile(filePath, "utf8")
      const data = BenchmarkFileSchema.parse(parse(text))
      const procPath = path.join(processedDir, `${slug}.yaml`)
      const procText = await fs.readFile(procPath, "utf8")
      const parsed = ProcessedBenchmarkFileSchema.parse(parse(procText))
      const { sigmoid, ...modelResults } = parsed as {
        sigmoid?: { min: number; max: number; midpoint: number; slope: number }
      } &
        Record<
          string,
          {
            score: number
            normalized_score?: number
            cost?: number
            normalized_cost?: number
          }
        >
      for (const modelSlug of Object.keys(llmMap)) {
        const llm = llmMap[modelSlug]
        const ability = llm.ability
        if (ability === undefined || !sigmoid) continue
        const norm =
          1 / (1 + Math.exp(-(ability - sigmoid.midpoint) / sigmoid.slope))
        const score = sigmoid.min + (sigmoid.max - sigmoid.min) * norm
        const res = modelResults[modelSlug]
        const hasCost = res && res.cost !== undefined && res.cost > 0
        const normalizedCost =
          res && res.normalized_cost !== undefined
            ? Number(res.normalized_cost)
            : undefined
        llm.benchmarks[data.benchmark] = {
          score: score,
          normalizedScore: norm * 100,
          description: data.description,
          ...(hasCost ? { costPerTask: Number(res.cost) } : {}),
          ...(normalizedCost !== undefined
            ? { normalizedCost: normalizedCost }
            : {}),
          scoreWeight: data.score_weight,
          costWeight: data.cost_weight,
        }
      }
    } catch (error) {
      console.error(`Failed to load benchmark data for ${slug}:`, error)
    }
  }

  const abilityScore = (a: number) =>
    ABILITY_SIGMOID.min +
    (ABILITY_SIGMOID.max - ABILITY_SIGMOID.min) /
      (1 + Math.exp(-(a - ABILITY_SIGMOID.midpoint) / ABILITY_SIGMOID.slope))

  const results = Object.values(llmMap).map((llm) => {
    const ability = llm.ability
    if (ability !== undefined) {
      llm.averageScore = abilityScore(ability)
    }
    return llm
  })

  for (const llm of results) {
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
