import { chromium } from "playwright"
import path from "path"
import { fileURLToPath } from "url"
import { saveBenchmarkResults } from "./utils"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const browser = await chromium.launch({
    headless: true,
  })

  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()

  try {
    await page.goto("https://artificialanalysis.ai/leaderboards/models")
    await page.waitForLoadState("networkidle")

    // Expand the Intelligence column
    const intelligenceElement = await page.getByText("Intelligence", {
      exact: true,
    })
    const intelligenceHeader = await page.locator("th", {
      has: intelligenceElement,
    })
    const intelligenceExpandButton = await intelligenceHeader.locator("button")
    await intelligenceExpandButton.click()

    // Get GPQA-diamond results
    const results: Record<string, number> = {}
    const rows = await page.locator("tbody tr")
    for (const row of await rows.all()) {
      const cells = await row.locator("td")
      const model = await cells.nth(0).innerText()
      const scoreText = await cells.nth(5).innerText()
      const score = parseFloat(scoreText)
      if (!isNaN(score)) {
        results[model] = score
      }
    }

    // Save results to yaml
    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "benchmarks",
      "gpqa-diamond.yaml",
    )
    await saveBenchmarkResults(outPath, results)
  } catch (error) {
    console.error("Error during scraping:", error)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
