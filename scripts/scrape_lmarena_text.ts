import path from "path"
import { fileURLToPath } from "url"
import { execFileSync } from "child_process"
import fs from "fs/promises"
import os from "os"
import { curl, saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main(): Promise<void> {
  const metaText = curl(
    "https://huggingface.co/api/spaces/lmarena-ai/chatbot-arena-leaderboard?raw=1",
  )
  const jsonStart = metaText.indexOf("{")
  const meta = JSON.parse(metaText.slice(jsonStart))
  const latest = meta.siblings
    .map((s: any) => s.rfilename as string)
    .filter((n: string) => /^elo_results_.*\.pkl$/.test(n))
    .sort()
    .pop()
  if (!latest) throw new Error("Unable to find latest results file")
  const pkl = execFileSync(
    "curl",
    [
      "-sL",
      `https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/${latest}`,
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  )

  const tmpPath = path.join(os.tmpdir(), "lmarena.pkl")
  await fs.writeFile(tmpPath, pkl)
  const pyPath = path.join(__dirname, "unpickle_lmarena_text.py")
  const pyOut = execFileSync("python", [pyPath, tmpPath], {
    encoding: "utf8",
  })
  const results: Record<string, number> = {}
  for (const line of pyOut.trim().split("\n")) {
    const [model, score] = line.split("\t")
    results[model] = parseFloat(score)
  }
  const outPath = path.join(
    __dirname,
    "..",
    "data",
    "raw",
    "benchmarks",
    "lmarena-text.yaml",
  )
  await saveBenchmarkResults(outPath, results)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
