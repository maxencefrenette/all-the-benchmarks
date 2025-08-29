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

type FamilyEntry = Entry & {
  model: string
  provider: string
}

type Props = {
  provider: string
  entries: Entry[]
  familyEntries?: FamilyEntry[]
  xDomain: [number, number]
  yDomain?: [number, number]
  yTicks?: number[]
}

export default function ModelCostScoreChart({
  provider,
  entries,
  familyEntries = [],
  xDomain,
  yDomain = [0, 100],
  yTicks = [0, 25, 50, 75, 100],
}: Props) {
  const items = React.useMemo(() => {
    const base = entries
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
      }))

    const extras = familyEntries
      .filter(
        (e) =>
          e.result.normalizedCost !== undefined &&
          e.result.normalizedScore !== undefined,
      )
      .map((e) => ({
        label: `${e.model} – ${e.benchmark}`,
        provider: e.provider,
        cost: e.result.normalizedCost as number,
        score: e.result.normalizedScore as number,
        opacity: 0.6,
      }))

    return [...base, ...extras] as CostPerformanceEntry[]
  }, [entries, familyEntries, provider])

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
      xDomain={xDomain}
      yDomain={yDomain}
      yTicks={yTicks}
      renderTooltip={renderTooltip}
    />
  )
}
