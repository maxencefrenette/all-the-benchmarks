import { parse } from "yaml"
import fs from "fs/promises"
import path from "path"
import {
  BenchmarkFileSchema,
  ProcessedBenchmarkFileSchema,
} from "./yaml-schemas"

export interface BenchmarkInfo {
  slug: string
  benchmark: string
  description: string
  website?: string
  github?: string
  modelCount: number
  hasCost: boolean
  privateHoldout: boolean
}

export async function loadBenchmarks(): Promise<BenchmarkInfo[]> {
  const benchmarkDir = path.join(process.cwd(), "data", "benchmarks")
  const processedDir = path.join(process.cwd(), "data", "benchmarks_processed")
  const slugs = (await fs.readdir(benchmarkDir))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(/\.yaml$/, ""))

  const benchmarks: BenchmarkInfo[] = []
  for (const slug of slugs) {
    try {
      const text = await fs.readFile(
        path.join(benchmarkDir, `${slug}.yaml`),
        "utf8",
      )
      const data = BenchmarkFileSchema.parse(parse(text))
      const procText = await fs.readFile(
        path.join(processedDir, `${slug}.yaml`),
        "utf8",
      )
      const results = ProcessedBenchmarkFileSchema.parse(parse(procText))
      benchmarks.push({
        slug,
        benchmark: data.benchmark,
        description: data.description,
        website: data.website,
        github: data.github,
        modelCount: Object.keys(results).length,
        hasCost: Object.values(results).some((r) => r.cost !== undefined),
        privateHoldout: data.private_holdout,
      })
    } catch (error) {
      console.error(`Failed to load benchmark info for ${slug}:`, error)
    }
  }
  return benchmarks.sort((a, b) => a.benchmark.localeCompare(b.benchmark))
}

export interface BenchmarkDetails extends BenchmarkInfo {
  results: Record<string, number>
  cost_per_task?: Record<string, number>
}

export async function loadBenchmarkDetails(
  slug: string,
): Promise<BenchmarkDetails | null> {
  const benchmarkDir = path.join(process.cwd(), "data", "benchmarks")
  const processedDir = path.join(process.cwd(), "data", "benchmarks_processed")
  try {
    const text = await fs.readFile(
      path.join(benchmarkDir, `${slug}.yaml`),
      "utf8",
    )
    const data = BenchmarkFileSchema.parse(parse(text))
    const procText = await fs.readFile(
      path.join(processedDir, `${slug}.yaml`),
      "utf8",
    )
    const results = ProcessedBenchmarkFileSchema.parse(parse(procText))
    const costMap: Record<string, number> = {}
    for (const [k, v] of Object.entries(results)) {
      if (v.cost !== undefined) costMap[k] = v.cost
    }
    const scoreMap: Record<string, number> = {}
    for (const [k, v] of Object.entries(results)) {
      scoreMap[k] = v.score
    }
    return {
      slug,
      benchmark: data.benchmark,
      description: data.description,
      website: data.website,
      github: data.github,
      modelCount: Object.keys(results).length,
      hasCost: Object.keys(costMap).length > 0,
      privateHoldout: data.private_holdout,
      results: scoreMap,
      cost_per_task: Object.keys(costMap).length > 0 ? costMap : undefined,
    }
  } catch (error) {
    console.error(`Failed to load benchmark details for ${slug}:`, error)
    return null
  }
}
