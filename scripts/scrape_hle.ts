import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import YAML from "yaml"
import { curl } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Entry {
  model: string
  score: number
}

async function main(): Promise<void> {
  const html = curl("https://scale.com/leaderboard/humanitys_last_exam")
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s,
  )
  if (!match) throw new Error("Failed to extract Next.js data")
  const data = JSON.parse(match[1]) as {
    props: { pageProps: { entries: Entry[] } }
  }
  const results: Record<string, number> = {}
  for (const entry of data.props.pageProps.entries) {
    results[entry.model] = entry.score
  }
  const yamlObj = {
    benchmark: "Humanity's Last Exam",
    description: "Score on Scale's Humanity's Last Exam",
    results,
  }
  const outPath = path.join(
    __dirname,
    "..",
    "public",
    "data",
    "benchmarks",
    "humanitys-last-exam.yaml",
  )
  await fs.writeFile(outPath, YAML.stringify(yamlObj))
  console.log(`Wrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
