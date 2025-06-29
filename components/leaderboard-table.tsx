"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  loadLLMData,
  transformToTableData,
  type TableRow,
} from "@/lib/data-loader"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default function LeaderboardTable() {
  const [tableData, setTableData] = useState<TableRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLLMData().then((data) => {
      const transformedData = transformToTableData(data)
      setTableData(transformedData)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading benchmark data...</div>
      </div>
    )
  }

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
        <CardHeader>
          <CardTitle>Benchmark Results</CardTitle>
          <CardDescription>
            Compare LLM performance across MMLU, HellaSwag, and ARC benchmarks.
            Click column headers to sort, use filters to narrow results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  )
}
