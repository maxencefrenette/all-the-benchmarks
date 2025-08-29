"use client"

import React from "react"
import { LLMData } from "@/lib/data-loader"
import { useSearchParams } from "next/navigation"
import CostPerformanceChart, {
  CostPerformanceEntry,
} from "./cost-performance-chart"
import {
  MIN_BENCHMARKS,
  MIN_COST_BENCHMARKS,
  MIN_NEW_MODEL_BENCHMARKS,
  MIN_NEW_MODEL_COST_BENCHMARKS,
} from "@/lib/settings"

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function countCostBenchmarks(llm: LLMData) {
  return Object.values(llm.benchmarks).filter(
    (b) => b.normalizedCost !== undefined,
  ).length
}

type Props = {
  llmData: LLMData[]
  showDeprecated: boolean
  showIncomplete: boolean
}

export default function CostScoreChart({
  llmData,
  showDeprecated,
  showIncomplete,
}: Props) {
  const searchParams = useSearchParams()
  const useLinearScale = searchParams.get("linear") === "true"
  const sorted = React.useMemo(
    () => [...llmData].sort((a, b) => a.slug.localeCompare(b.slug)),
    [llmData],
  )

  const visible = React.useMemo(
    () =>
      sorted.filter((m) => {
        const isNew =
          m.releaseDate && Date.now() - m.releaseDate.getTime() < ONE_WEEK_MS
        const benchmarkCount = Object.keys(m.benchmarks).length
        const costCount = countCostBenchmarks(m)
        return (
          (isNew &&
            benchmarkCount >= MIN_NEW_MODEL_BENCHMARKS &&
            costCount >= MIN_NEW_MODEL_COST_BENCHMARKS) ||
          ((showDeprecated || !m.deprecated) &&
            (showIncomplete ||
              (benchmarkCount >= MIN_BENCHMARKS &&
                costCount >= MIN_COST_BENCHMARKS)))
        )
      }),
    [sorted, showDeprecated, showIncomplete],
  )

  const entries = React.useMemo(() => {
    return visible
      .filter((m) => m.normalizedCost !== undefined)
      .map((m) => ({
        label: m.model,
        provider: m.provider,
        cost: m.normalizedCost as number,
        score: m.averageScore ?? 0,
        connectKey: m.modelSlug,
        meta: m,
      })) as CostPerformanceEntry[]
  }, [visible])

  const renderTooltip = React.useCallback((entry: CostPerformanceEntry) => {
    const llm = entry.meta as LLMData
    const scoreCount = Object.keys(llm.benchmarks).length
    const costCount = countCostBenchmarks(llm)
    return (
      <div className="grid gap-0.5">
        <span>{llm.model}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {scoreCount} score benchmark{scoreCount === 1 ? "" : "s"}, {costCount}{" "}
          cost benchmark{costCount === 1 ? "" : "s"}
        </span>
      </div>
    )
  }, [])

  const extraTooltipEntries = React.useCallback(
    (entry: CostPerformanceEntry) => [
      { name: "Score/Cost", value: entry.score / entry.cost },
    ],
    [],
  )

  if (!entries.length) return null

  return (
    <div className={useLinearScale ? "w-[3000px]" : undefined}>
      <CostPerformanceChart
        entries={entries}
        xLabel="Normalized Cost per Task ($)"
        yLabel="Average Normalized Score"
        yDomain={[0, 100]}
        yTicks={[0, 25, 50, 75, 100]}
        xScale={useLinearScale ? "linear" : "log"}
        renderTooltip={renderTooltip}
        getExtraTooltipEntries={extraTooltipEntries}
        className={useLinearScale ? "aspect-auto" : undefined}
        style={useLinearScale ? { height: "calc(100vw * 0.5625)" } : undefined}
      />
    </div>
  )
}
