"use client"

import React from "react"
import CostPerformanceChart, {
  CostPerformanceEntry,
} from "./cost-performance-chart"
import { BenchmarkResult } from "@/lib/data-loader"

type Entry = {
  benchmark: string
  result: BenchmarkResult
}

type Props = {
  provider: string
  entries: Entry[]
}

export default function ModelCostScoreChart({ provider, entries }: Props) {
  const items = React.useMemo(() => {
    return entries
      .filter(
        (e) =>
          e.result.normalizedCost !== undefined &&
          e.result.normalizedScore !== undefined,
      )
      .map((e) => ({
        label: e.benchmark,
        provider,
        cost: e.result.normalizedCost as number,
        score: e.result.normalizedScore as number,
      })) as CostPerformanceEntry[]
  }, [entries, provider])

  const renderTooltip = React.useCallback(
    (entry: CostPerformanceEntry) => <span>{entry.label}</span>,
    [],
  )

  if (!items.length) return null

  return (
    <CostPerformanceChart
      entries={items}
      xLabel="Normalized Cost per Task ($)"
      yLabel="Normalized Score"
      renderTooltip={renderTooltip}
    />
  )
}
