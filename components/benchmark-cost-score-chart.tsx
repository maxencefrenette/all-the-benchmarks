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
  modelSlug: string
  reasoningOrder: number
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
        connectKey: e.modelSlug,
        meta: { reasoningOrder: e.reasoningOrder },
      })) as CostPerformanceEntry[]
  }, [entries])

  if (!items.length) return null

  return (
    <CostPerformanceChart entries={items} xLabel="Cost ($)" yLabel="Score" />
  )
}
