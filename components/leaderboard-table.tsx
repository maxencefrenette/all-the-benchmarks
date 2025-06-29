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
    <Card>
      <CardContent>
        <DataTable columns={columns} data={tableData} />
      </CardContent>
    </Card>
  )
}
