import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
})
