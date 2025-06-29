import { PlaywrightCrawler } from "crawlee"

async function main() {
  const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, enqueueLinks, pushData, log }) {
      const $intelligence = await page.locator("span", {
        hasText: "Intelligence",
      })

      //   const $intelligenceHeader = await page.locator("*", {
      //     has: $intelligence,
      //   })

      console.log($intelligence.innerText())

      // Save results as JSON to `./storage/datasets/default` directory.
      // await pushData({ title, url: request.loadedUrl })
    },

    // Uncomment this option to see the browser window.
    // headless: false,
  })

  await crawler.run(["https://artificialanalysis.ai/leaderboards/models"])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
