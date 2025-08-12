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
  xDomain: [number, number]
  yDomain?: [number, number]
  yTicks?: number[]
}

export default function ModelCostScoreChart({
  provider,
  entries,
  xDomain,
  yDomain = [0, 100],
  yTicks = [0, 25, 50, 75, 100],
}: Props) {
  const items = React.useMemo(() => {
    return entries
      .filter(
        (e) =>
          e.result.normalizedCost !== undefined &&
          e.result.sigmoidScore !== undefined,
      )
      .map((e) => ({
        label: e.benchmark,
        provider,
        cost: e.result.normalizedCost as number,
        score: e.result.sigmoidScore as number,
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
      yLabel="Sigmoid Score"
      xDomain={xDomain}
      yDomain={yDomain}
      yTicks={yTicks}
      renderTooltip={renderTooltip}
    />
  )
}
