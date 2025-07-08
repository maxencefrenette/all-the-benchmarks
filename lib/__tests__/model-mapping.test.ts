import fs from "fs/promises"
import path from "path"
import { parse } from "yaml"
import { expect, test } from "vitest"

// Ensure every mapping file only points to existing model slugs

test("mapping files reference valid slugs", async () => {
  const modelsDir = path.join(process.cwd(), "data", "models")
  const mappingsDir = path.join(process.cwd(), "data", "mappings")

  const modelSlugs = new Set(
    (await fs.readdir(modelsDir))
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => f.replace(/\.yaml$/, "")),
  )

  const mappingFiles = (await fs.readdir(mappingsDir)).filter((f) =>
    f.endsWith(".yaml"),
  )

  const invalid: string[] = []
  for (const file of mappingFiles) {
    const text = await fs.readFile(path.join(mappingsDir, file), "utf8")
    const mapping = parse(text) as Record<string, string | null>
    for (const slug of Object.values(mapping)) {
      if (slug && !modelSlugs.has(slug)) {
        invalid.push(`${file}: ${slug}`)
      }
    }
  }

  expect(invalid).toEqual([])
})
