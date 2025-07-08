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
  for (const file of files) {
    const text = await fs.readFile(path.join(mappingsDir, file), "utf8")
    const mapping = parse(text) as Record<string, string | null>
    for (const slug of Object.values(mapping)) {
      if (!slug) continue
      const slugPath = path.join(modelsDir, `${slug}.yaml`)
      const exists = await fs
        .access(slugPath)
        .then(() => true)
        .catch(() => false)
      expect(exists, `${file} maps to missing slug ${slug}`).toBe(true)
    }
  }
})
