import { test, expect } from "@playwright/test"

test("leaderboard page loads and models are present", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "LLM Benchmark Leaderboard" }),
  ).toBeVisible()

  await expect(page.getByText("Claude 4 Opus")).toBeVisible()
  await expect(page.getByText("Gemini 2.5 Pro (06-05)")).toBeVisible()
  await expect(page.getByText("Claude 4 Sonnet")).toBeVisible()
})
