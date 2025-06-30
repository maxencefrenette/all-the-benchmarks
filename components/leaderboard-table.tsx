import { Card, CardContent } from "@/components/ui/card"
import {
  loadLLMData,
  transformToTableData,
  type TableRow,
  LLMData,
} from "@/lib/data-loader"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default async function LeaderboardTable({
  llmData,
}: {
  llmData: LLMData[]
}) {
  const tableData: TableRow[] = transformToTableData(llmData)

  return (
    <Card className="border-0">
      <CardContent>
        <DataTable columns={columns} data={tableData} />
      </CardContent>
    </Card>
  )
}
