"use client"

import { Card, CardContent } from "@/components/ui/card"
import { transformToTableData, type TableRow } from "@/lib/table-utils"
import type { LLMData } from "@/lib/data-loader"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function LeaderboardTable({ llmData }: { llmData: LLMData[] }) {
  const tableData: TableRow[] = transformToTableData(llmData)

  return (
    <Card className="border-0">
      <CardContent>
        <TooltipProvider>
          <DataTable columns={columns} data={tableData} />
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
