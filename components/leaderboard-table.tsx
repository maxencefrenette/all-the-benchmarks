import { Card, CardContent } from "@/components/ui/card"
import {
  loadLLMData,
  transformToTableData,
  type TableRow,
} from "@/lib/data-loader"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default async function LeaderboardTable() {
  const data = await loadLLMData()
  const tableData: TableRow[] = transformToTableData(data)

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">LLM Benchmark Leaderboard</h1>
        <p className="text-muted-foreground text-lg">
          Sortable and filterable comparison of LLM performance across key
          benchmarks
        </p>
      </div>

      <Card>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  )
}
