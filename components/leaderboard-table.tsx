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

      <Card>
        <CardHeader>
          <CardTitle>Benchmark Details</CardTitle>
          <CardDescription>
            Understanding the evaluation metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold">MMLU</h4>
              <p className="text-sm text-muted-foreground">
                Measures knowledge across 57 academic subjects including
                mathematics, history, computer science, and more.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">HellaSwag</h4>
              <p className="text-sm text-muted-foreground">
                Tests commonsense reasoning by asking models to complete
                scenarios with the most logical ending.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">ARC</h4>
              <p className="text-sm text-muted-foreground">
                AI2 Reasoning Challenge focusing on grade-school level science
                questions requiring reasoning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
