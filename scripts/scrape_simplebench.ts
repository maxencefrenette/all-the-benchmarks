import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"
import YAML from "yaml"
import vm from "vm"

function curl(url: string): string {
  return execSync(`curl -sL ${url}`, { encoding: "utf8" })
}

interface Entry {
  rank: string
  model: string
  score: string
  organization: string
}

async function main(): Promise<void> {
  const js = curl("https://simple-bench.com/static/js/leaderboard-data.js")
  const context: { data?: Entry[] } = {}
  vm.runInNewContext(`${js}\nthis.data = leaderboardData`, context)
  const data = context.data
  if (!data) throw new Error("Failed to parse leaderboard data")

  const modelsDir = path.join(__dirname, "..", "public", "data", "models")
  const files = await fs.readdir(modelsDir)
  const aliasMap: Record<string, string[]> = {}
  for (const file of files) {
    const slug = path.basename(file, ".yaml")
    const content = await fs.readFile(path.join(modelsDir, file), "utf8")
    const parsed = YAML.parse(content) as {
      model: string
      aliases?: string[]
    }
    aliasMap[slug] = [parsed.model, ...(parsed.aliases || [])]
  }

  function slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const results: Record<string, number> = {}
  for (const entry of data) {
    const score = parseFloat(entry.score.replace(/%/, ""))
    const slugEntry = Object.entries(aliasMap).find(([, names]) =>
      names.includes(entry.model),
    )
    const slug = slugEntry ? slugEntry[0] : slugify(entry.model)
    results[slug] = score
  }
  const yamlObj = {
    benchmark: "SimpleBench",
    description: "Score (AVG@5) on SimpleBench",
    results,
  }
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "simplebench.yaml",
  )
  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
