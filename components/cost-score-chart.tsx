"use client"

import React from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
} from "recharts"
import { LLMData } from "@/lib/data-loader"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"

type Props = {
  llmData: LLMData[]
  showDeprecated: boolean
}

export default function CostScoreChart({ llmData, showDeprecated }: Props) {
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
    () => sorted.filter((m) => showDeprecated || !m.deprecated),
    [sorted, showDeprecated],
  )

  const costDomain = React.useMemo(() => {
    let min = Infinity
    let max = -Infinity
    for (const item of visible) {
      if (item.normalizedCost !== undefined) {
        min = Math.min(min, item.normalizedCost)
        max = Math.max(max, item.normalizedCost)
      }
    }
    if (!isFinite(min) || !isFinite(max)) return [0, 1]
    return [min, max]
  }, [visible])

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
          <CartesianGrid />
          <XAxis
            dataKey="normalizedCost"
            type="number"
            name="Cost"
            scale="log"
            domain={costDomain as [number, number]}
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
                  ? d
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
