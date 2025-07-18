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
      url: "https://artificialanalysis.ai/evaluations/gpqa-diamond",
      resultsSelector: "#gpqa-diamond-benchmark-leaderboard-results",
      costSelector: "#gpqa-diamond-benchmark-leaderboard-cost-breakdown",
    })

    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "raw",
      "benchmarks",
      "gpqa-diamond.yaml",
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
