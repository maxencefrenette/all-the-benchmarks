import { loadLLMDetails } from "../data-loader"
import { expect, test } from "vitest"

test("loadLLMDetails returns a specific model", async () => {
  const model = await loadLLMDetails("grok-3")
  expect(model).not.toBeNull()
  expect(model?.model).toBe("Grok 3")
})

test("loadLLMDetails returns null for unknown slugs", async () => {
  const model = await loadLLMDetails("does-not-exist")
  expect(model).toBeNull()
})
