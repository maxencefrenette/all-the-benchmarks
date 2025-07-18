import { expect, test } from "vitest"
import fs from "fs/promises"
import path from "path"
import { parse } from "yaml"
import { MappingFileSchema, ModelFileSchema } from "../yaml-schemas"

// Ensure all mapping files only reference slugs that exist under data/config/models

test("mapping files only reference existing slugs", async () => {
  const mappingsDir = path.join(process.cwd(), "data", "mappings")
  const modelsDir = path.join(process.cwd(), "data", "config", "models")
  const files = (await fs.readdir(mappingsDir)).filter((f) =>
    f.endsWith(".yaml"),
  )
  const knownSlugs = new Set<string>()
  const modelFiles = (await fs.readdir(modelsDir)).filter((f) =>
    f.endsWith(".yaml"),
  )
  for (const file of modelFiles) {
    const text = await fs.readFile(path.join(modelsDir, file), "utf8")
    const data = ModelFileSchema.parse(parse(text))
    for (const slug of Object.keys(data.reasoning_efforts)) {
      knownSlugs.add(slug)
    }
  }
  for (const file of files) {
    const text = await fs.readFile(path.join(mappingsDir, file), "utf8")
    const mapping = MappingFileSchema.parse(parse(text))
    for (const slug of Object.values(mapping)) {
      if (!slug) continue
      expect(knownSlugs.has(slug), `${file} maps to missing slug ${slug}`).toBe(
        true,
      )
    }
  }
})
