import { chromium } from "playwright"
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
      url: "https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index",
      resultsSelector: "#artificial-analysis-intelligence-index-results",
      costSelector: "#artificial-analysis-intelligence-index-cost-breakdown",
    })

    // Save results to yaml
    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "benchmarks",
      "artificial-analysis-index.yaml",
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
