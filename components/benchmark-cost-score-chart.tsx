"use client"

import React from "react"
import CostPerformanceChart, {
  CostPerformanceEntry,
} from "./cost-performance-chart"

type Entry = {
  model: string
  provider: string
  score: number
  costPerTask: number
}

type Props = {
  entries: Entry[]
}

export default function BenchmarkCostScoreChart({ entries }: Props) {
  const items = React.useMemo(() => {
    return entries
      .filter((e) => e.costPerTask > 0)
      .map((e) => ({
        label: e.model,
        provider: e.provider,
        cost: e.costPerTask,
        score: e.score,
      })) as CostPerformanceEntry[]
  }, [entries])

  if (!items.length) return null

  return (
    <CostPerformanceChart entries={items} xLabel="Cost ($)" yLabel="Score" />
  )
}
