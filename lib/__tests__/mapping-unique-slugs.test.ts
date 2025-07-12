import { expect, test } from "vitest"
import fs from "fs/promises"
import path from "path"
import { parse } from "yaml"
import { MappingFileSchema } from "../yaml-schemas"

// Ensure no mapping file assigns multiple aliases to the same slug

test("mapping files do not map multiple models to the same slug", async () => {
  const mappingsDir = path.join(process.cwd(), "data", "mappings")
  const files = (await fs.readdir(mappingsDir)).filter((f) =>
    f.endsWith(".yaml"),
  )

  for (const file of files) {
    const text = await fs.readFile(path.join(mappingsDir, file), "utf8")
    const mapping = MappingFileSchema.parse(parse(text))
    const seen = new Set<string>()
    for (const slug of Object.values(mapping)) {
      if (!slug) continue
      expect(
        seen.has(slug),
        `${file} maps multiple aliases to slug ${slug}`,
      ).toBe(false)
      seen.add(slug)
    }
  }
})
