import { chromium } from "playwright"
import fs from "fs/promises"
import path from "path"
import YAML from "yaml"

async function main() {
  const browser = await chromium.launch({
    headless: true,
  })

  try {
    const page = await browser.newPage()
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
    const yamlObj = {
      benchmark: "GPQA Diamond",
      description: "Score on GPQA Diamond benchmark",
      results,
    }
    const outPath = path.join(
      __dirname,
      "..",
      "public",
      "data",
      "benchmarks",
      "gpqa-diamond.yaml",
    )
    await fs.writeFile(outPath, YAML.stringify(yamlObj))
    console.log(`Wrote ${outPath}`)
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
