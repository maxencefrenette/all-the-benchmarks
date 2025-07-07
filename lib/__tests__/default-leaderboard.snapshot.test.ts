import { loadLLMData } from "../data-loader"
import { transformToTableData } from "../table-utils"
import { stringify } from "yaml"
import { expect, test } from "vitest"
import path from "path"

// Snapshot of the data that appears in the top 10 rows of the default leaderboard
// This ensures data loading remains stable independent of the UI

test("default leaderboard top 10 data", async () => {
  const llmData = await loadLLMData()
  const tableRows = transformToTableData(llmData)
    .slice(0, 10)
    .map((row) => ({
      ...row,
      averageScore: Number(row.averageScore.toFixed(2)),
      costPerTask:
        row.costPerTask === null ? null : Number(row.costPerTask.toFixed(2)),
    }))
  const yamlData = stringify(tableRows)
  const snapshotFile = path.join(
    __dirname,
    "__snapshots__",
    "default-leaderboard-top10.yaml",
  )
  await expect(yamlData).toMatchFileSnapshot(snapshotFile)
})
