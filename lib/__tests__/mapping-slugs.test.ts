import { expect, test } from "vitest"
import fs from "fs/promises"
import path from "path"
import { parse } from "yaml"

// Ensure all mapping files only reference slugs that exist under data/models

test("mapping files only reference existing slugs", async () => {
  const mappingsDir = path.join(process.cwd(), "data", "mappings")
  const modelsDir = path.join(process.cwd(), "data", "models")
  const files = (await fs.readdir(mappingsDir)).filter((f) =>
    f.endsWith(".yaml"),
  )
  const knownSlugs = new Set<string>()
  const modelFiles = (await fs.readdir(modelsDir)).filter((f) =>
    f.endsWith(".yaml"),
  )
  for (const file of modelFiles) {
    const text = await fs.readFile(path.join(modelsDir, file), "utf8")
    const data = parse(text) as {
      models: Record<string, string>
    }
    for (const slug of Object.keys(data.models)) {
      knownSlugs.add(slug)
    }
  }
  for (const file of files) {
    const text = await fs.readFile(path.join(mappingsDir, file), "utf8")
    const mapping = parse(text) as Record<string, string | null>
    for (const slug of Object.values(mapping)) {
      if (!slug) continue
      expect(knownSlugs.has(slug), `${file} maps to missing slug ${slug}`).toBe(
        true,
      )
    }
  }
})
