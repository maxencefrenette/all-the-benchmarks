"use client"

import React from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis } from "recharts"
import { LLMData } from "@/lib/data-loader"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"

const BASE_TICKS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30] as const

const MIN_BENCHMARKS = 5
const MIN_COST_BENCHMARKS = 3
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
  const sorted = React.useMemo(
    () => [...llmData].sort((a, b) => a.slug.localeCompare(b.slug)),
    [llmData],
  )
  const groups = React.useMemo(() => {
    const map: Record<string, LLMData[]> = {}
    for (const item of sorted) {
      if (!map[item.provider]) map[item.provider] = []
      map[item.provider].push(item)
    }
    return map
  }, [sorted])

  const modelGroups = React.useMemo(() => {
    const map: Record<string, LLMData[]> = {}
    for (const item of llmData) {
      if (!map[item.modelSlug]) map[item.modelSlug] = []
      map[item.modelSlug].push(item)
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.reasoningOrder - b.reasoningOrder)
    }
    return map
  }, [llmData])

  const visible = React.useMemo(
    () =>
      sorted.filter((m) => {
        const isNew =
          m.releaseDate && Date.now() - m.releaseDate.getTime() < ONE_WEEK_MS
        return (
          isNew ||
          ((showDeprecated || !m.deprecated) &&
            (showIncomplete ||
              (Object.keys(m.benchmarks).length >= MIN_BENCHMARKS &&
                countCostBenchmarks(m) >= MIN_COST_BENCHMARKS)))
        )
      }),
    [sorted, showDeprecated, showIncomplete],
  )

  const costDomain = React.useMemo(() => {
    const FACTOR = 1.2
    let min = Infinity
    let max = -Infinity
    for (const item of visible) {
      if (item.normalizedCost !== undefined) {
        min = Math.min(min, item.normalizedCost)
        max = Math.max(max, item.normalizedCost)
      }
    }
    if (!isFinite(min) || !isFinite(max)) return [0, 1]
    return [min / FACTOR, max * FACTOR]
  }, [visible])

  const ticks = React.useMemo(
    () => BASE_TICKS.filter((t) => t >= costDomain[0] && t <= costDomain[1]),
    [costDomain],
  )

  if (!llmData.length) return null

  return (
    <div className="p-6 pt-0">
      <ChartContainer
        config={{
          normalizedCost: { label: "Cost" },
          averageScore: { label: "Score" },
        }}
      >
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis
            dataKey="normalizedCost"
            type="number"
            name="Cost"
            scale="log"
            domain={costDomain as [number, number]}
            ticks={ticks}
            tickFormatter={(v) => v && v.toFixed(2)}
            label={{
              value: "Normalized Cost per Task ($)",
              position: "insideBottom",
              offset: -10,
            }}
          />
          <YAxis
            dataKey="averageScore"
            type="number"
            domain={[0, 100]}
            name="Score"
            label={{
              value: "Average Normalized Score",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <ZAxis range={[144, 144]} />
          <ChartTooltip
            cursor={false}
            labelFormatter={(_, payload) => {
              const llm = payload?.[0]?.payload as LLMData
              if (!llm) return null
              const scoreCount = Object.keys(llm.benchmarks).length
              const costCount = countCostBenchmarks(llm)
              return (
                <div className="grid gap-0.5">
                  <span>{llm.model}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {scoreCount} score benchmark{scoreCount === 1 ? "" : "s"},{" "}
                    {costCount} cost benchmark{costCount === 1 ? "" : "s"}
                  </span>
                </div>
              )
            }}
            itemSorter={(a, b) => {
              const order: Record<string, number> = { Score: 0, Cost: 1 }
              return (
                (order[a.name as string] ?? 0) - (order[b.name as string] ?? 0)
              )
            }}
            formatter={(value: number | string, name: string) => (
              <span>
                {name}: {typeof value === "number" ? value.toFixed(2) : value}
              </span>
            )}
            content={<ChartTooltipContent />}
          />
          {Object.entries(groups).map(([provider, data]) => (
            <Scatter
              key={provider}
              data={data.map((d) => {
                const isNew =
                  d.releaseDate &&
                  Date.now() - d.releaseDate.getTime() < ONE_WEEK_MS
                return showDeprecated || !d.deprecated || isNew
                  ? showIncomplete ||
                    (Object.keys(d.benchmarks).length >= MIN_BENCHMARKS &&
                      countCostBenchmarks(d) >= MIN_COST_BENCHMARKS) ||
                    isNew
                    ? d
                    : { ...d, normalizedCost: NaN, averageScore: NaN }
                  : { ...d, normalizedCost: NaN, averageScore: NaN }
              })}
              name={provider}
              fill={PROVIDER_COLORS[provider]}
            />
          ))}

          {Object.entries(modelGroups).map(([model, data]) =>
            data.length > 1 ? (
              <Scatter
                key={`line-${model}`}
                data={data.map((d) => {
                  const isNew =
                    d.releaseDate &&
                    Date.now() - d.releaseDate.getTime() < ONE_WEEK_MS
                  return showDeprecated || !d.deprecated || isNew
                    ? showIncomplete ||
                      (Object.keys(d.benchmarks).length >= MIN_BENCHMARKS &&
                        countCostBenchmarks(d) >= MIN_COST_BENCHMARKS) ||
                      isNew
                      ? d
                      : { ...d, normalizedCost: NaN, averageScore: NaN }
                    : { ...d, normalizedCost: NaN, averageScore: NaN }
                })}
                name={model}
                fill={PROVIDER_COLORS[data[0].provider]}
                line={{
                  strokeDasharray: "4 4",
                  stroke: PROVIDER_COLORS[data[0].provider],
                }}
                shape={() => null}
              />
            ) : null,
          )}
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
