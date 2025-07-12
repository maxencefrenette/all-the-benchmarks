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
    await page.goto("https://artificialanalysis.ai/evaluations/gpqa-diamond")
    await page.waitForLoadState("networkidle")

    // Open the dropdown menu
    // Click on the first "20 of NUMBER models selected" button
    const filterButton = await page
      .getByText(/20 of \d+ models selected/, {
        exact: true,
      })
      .nth(0)
    await filterButton.click()

    // Turn on all models
    // Click on all the buttons with role="option" and aria-selected="false"
    const options = await page.$$("div[role='option'][aria-selected='false']")
    for (const option of options) {
      await option.click()
    }

    // Get the scores
    const scoresChartContainer = await page.locator(
      "#gpqa-diamond-benchmark-leaderboard-results",
    )
    const scoresChartSvg = await scoresChartContainer
      .locator("svg[role='img']")
      .first()
    const scoresSvgOuterGroup = await scoresChartSvg.locator("g").first()
    const scoresModelNamesGroup = await scoresSvgOuterGroup
      .locator("> g")
      .nth(-3)
    const scoresModelNamesTextNodes = await scoresModelNamesGroup
      .locator("text")
      .all()
    const scoresModelNames = await Promise.all(
      scoresModelNamesTextNodes.map(async (textNode) =>
        (await textNode.locator("tspan").allTextContents()).join(" ").trim(),
      ),
    )

    const scoresGroup = await scoresSvgOuterGroup.locator("> g").nth(-2)
    const scores = await (
      await scoresGroup.locator("text").allTextContents()
    ).map((score) => parseInt(score))

    // Get the costs
    const costsChartContainer = await page.locator(
      "#gpqa-diamond-benchmark-leaderboard-cost-breakdown",
    )
    const costsChartSvg = await costsChartContainer
      .locator("svg[role='img']")
      .first()
    const costsSvgOuterGroup = await costsChartSvg.locator("g").first()
    const costsModelNamesGroup = await costsSvgOuterGroup.locator("> g").nth(-3)
    const costsModelNamesTextNodes = await costsModelNamesGroup
      .locator("text")
      .all()
    const costsModelNames = await Promise.all(
      costsModelNamesTextNodes.map(async (textNode) =>
        (await textNode.locator("tspan").allTextContents()).join(" ").trim(),
      ),
    )
    const costsGroup = await costsSvgOuterGroup.locator("> g").nth(-2)
    const costs = await (
      await costsGroup.locator("text").allTextContents()
    ).map((cost) => parseInt(cost.replace(",", "")))

    const resultsMap: Record<string, number> = {}
    for (let i = 0; i < scoresModelNames.length; i++) {
      resultsMap[scoresModelNames[i]] = scores[i]
    }

    const costPerTaskMap: Record<string, number> = {}
    for (let i = 0; i < costsModelNames.length; i++) {
      costPerTaskMap[costsModelNames[i]] = costs[i]
    }

    // Save results to yaml
    const outPath = path.join(
      __dirname,
      "..",
      "data",
      "benchmarks",
      "gpqa-diamond.yaml",
    )
    await saveBenchmarkResults(outPath, resultsMap, costPerTaskMap)
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
