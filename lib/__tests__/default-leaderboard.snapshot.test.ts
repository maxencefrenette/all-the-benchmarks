import { loadLLMData } from "../data-loader"
import { transformToTableData } from "../table-utils"
import { stringify } from "yaml"
import { expect, test } from "vitest"
import path from "path"
import { formatSigFig } from "../utils"

// Snapshot of the data that appears in the top 10 rows of the default leaderboard
// This ensures data loading remains stable independent of the UI

test("default leaderboard top 10 data", async () => {
  const MIN_BENCHMARKS = 5
  const MIN_COST_BENCHMARKS = 3
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
  function countCostBenchmarks(llm: { benchmarks: Record<string, unknown> }) {
    return Object.values(llm.benchmarks).filter(
      (b) => (b as { normalizedCost?: number }).normalizedCost !== undefined,
    ).length
  }
  const llmData = (await loadLLMData()).filter(
    (m) =>
      (m.releaseDate && Date.now() - m.releaseDate.getTime() < ONE_WEEK_MS) ||
      (!m.deprecated &&
        Object.keys(m.benchmarks).length >= MIN_BENCHMARKS &&
        countCostBenchmarks(m) >= MIN_COST_BENCHMARKS),
  )
  const tableRows = transformToTableData(llmData)
    .slice(0, 10)
    .map((row) => ({
      ...row,
      averageScore: Number(row.averageScore.toFixed(2)),
      costPerTask:
        row.costPerTask === null ? null : Number(formatSigFig(row.costPerTask)),
    }))
  const yamlData = stringify(tableRows)
  const snapshotFile = path.join(
    __dirname,
    "__snapshots__",
    "default-leaderboard-top10.yaml",
  )
  await expect(yamlData).toMatchFileSnapshot(snapshotFile)
})
