import { parse } from "yaml"
import fs from "fs/promises"
import path from "path"

export interface BenchmarkInfo {
  slug: string
  benchmark: string
  description: string
}

export async function loadBenchmarks(): Promise<BenchmarkInfo[]> {
  const benchmarkDir = path.join(process.cwd(), "public", "data", "benchmarks")
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
      const data = parse(text) as { benchmark: string; description: string }
      if (!data.benchmark) {
        throw new Error(`Invalid benchmark structure for ${slug}`)
      }
      benchmarks.push({
        slug,
        benchmark: data.benchmark,
        description: data.description,
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
  model_name_mapping?: Record<string, string | null>
  model_name_mapping_file?: string
}

export async function loadBenchmarkDetails(
  slug: string,
): Promise<BenchmarkDetails | null> {
  const benchmarkDir = path.join(process.cwd(), "public", "data", "benchmarks")
  try {
    const text = await fs.readFile(
      path.join(benchmarkDir, `${slug}.yaml`),
      "utf8",
    )
    const data = parse(text) as {
      benchmark: string
      description: string
      results: Record<string, number>
      cost_per_task?: Record<string, number>
      model_name_mapping?: Record<string, string | null>
      model_name_mapping_file?: string
    }
    if (!data.benchmark || !data.results) {
      throw new Error(`Invalid benchmark structure for ${slug}`)
    }
    let mapping: Record<string, string | null> | undefined =
      data.model_name_mapping

    if (data.model_name_mapping_file) {
      try {
        const mapPath = path.join(
          process.cwd(),
          "public",
          "data",
          "mappings",
          data.model_name_mapping_file,
        )
        const mapText = await fs.readFile(mapPath, "utf8")
        const fileMap = parse(mapText) as Record<string, string | null>
        mapping = { ...fileMap, ...(mapping || {}) }
      } catch (err) {
        console.error(
          `Failed to load model_name_mapping_file for ${slug}:`,
          err,
        )
      }
    }

    return {
      slug,
      benchmark: data.benchmark,
      description: data.description,
      results: data.results,
      cost_per_task: data.cost_per_task,
      ...(mapping ? { model_name_mapping: mapping } : {}),
      ...(data.model_name_mapping_file
        ? { model_name_mapping_file: data.model_name_mapping_file }
        : {}),
    }
  } catch (error) {
    console.error(`Failed to load benchmark details for ${slug}:`, error)
    return null
  }
}
