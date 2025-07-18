import path from "path"
import { fileURLToPath } from "url"
import {
  saveBenchmarkResults,
  scrapeArtificialAnalysisBenchmark,
} from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  try {
    const { results, costPerTask } = await scrapeArtificialAnalysisBenchmark({
      url: "https://artificialanalysis.ai/evaluations/mmlu-pro",
      resultsSelector: "#mmlu-pro-benchmark-leaderboard-results",
      costSelector: "#mmlu-pro-benchmark-leaderboard-cost-breakdown",
      filterRegex: /\d+ of \d+ models selected/,
    })

    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "raw",
      "benchmarks",
      "mmlu-pro.yaml",
    )
    await saveBenchmarkResults(outPath, results, costPerTask)
  } catch (error) {
    console.error("Error during scraping:", error)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
