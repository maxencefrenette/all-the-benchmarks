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
