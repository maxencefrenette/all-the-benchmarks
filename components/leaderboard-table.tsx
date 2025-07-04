"use client"

import { transformToTableData, type TableRow } from "@/lib/table-utils"
import type { LLMData } from "@/lib/data-loader"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default function LeaderboardTable({ llmData }: { llmData: LLMData[] }) {
  const tableData: TableRow[] = transformToTableData(llmData)

  return (
    <div className="p-6 pt-0">
      <DataTable columns={columns} data={tableData} />
    </div>
  )
}
