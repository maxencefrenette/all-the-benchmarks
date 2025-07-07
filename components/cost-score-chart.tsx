"use client"

import React from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis } from "recharts"
import { LLMData } from "@/lib/data-loader"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"

const BASE_TICKS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30] as const

const MIN_BENCHMARKS = 5

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

  const visible = React.useMemo(
    () =>
      sorted.filter(
        (m) =>
          (showDeprecated || !m.deprecated) &&
          (showIncomplete ||
            Object.keys(m.benchmarks).length >= MIN_BENCHMARKS),
      ),
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
              value: "Normalized Cost per Task",
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
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as LLMData).model
            }
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
              data={data.map((d) =>
                showDeprecated || !d.deprecated
                  ? showIncomplete ||
                    Object.keys(d.benchmarks).length >= MIN_BENCHMARKS
                    ? d
                    : { ...d, normalizedCost: NaN, averageScore: NaN }
                  : { ...d, normalizedCost: NaN, averageScore: NaN },
              )}
              name={provider}
              fill={PROVIDER_COLORS[provider]}
            />
          ))}
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
