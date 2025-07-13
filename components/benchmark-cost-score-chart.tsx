"use client"

import React from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { formatSigFig } from "@/lib/utils"

const BASE_TICKS = [
  0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000,
] as const

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
  const data = React.useMemo(
    () => entries.filter((e) => e.costPerTask > 0),
    [entries],
  )

  const groups = React.useMemo(() => {
    const map: Record<string, Entry[]> = {}
    for (const item of data) {
      if (!map[item.provider]) map[item.provider] = []
      map[item.provider].push(item)
    }
    return map
  }, [data])

  const costDomain = React.useMemo(() => {
    const FACTOR = 1.2
    let min = Infinity
    let max = -Infinity
    for (const item of data) {
      min = Math.min(min, item.costPerTask)
      max = Math.max(max, item.costPerTask)
    }
    if (!isFinite(min) || !isFinite(max)) return [0, 1]
    return [min / FACTOR, max * FACTOR]
  }, [data])

  const ticks = React.useMemo(
    () => BASE_TICKS.filter((t) => t >= costDomain[0] && t <= costDomain[1]),
    [costDomain],
  )

  if (!data.length) return null

  return (
    <div className="p-6 pt-0">
      <ChartContainer
        config={{
          costPerTask: { label: "Cost ($)" },
          score: { label: "Score" },
        }}
      >
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis
            dataKey="costPerTask"
            type="number"
            name="Cost"
            scale="log"
            domain={costDomain as [number, number]}
            ticks={ticks}
            tickFormatter={(v) => (v ? formatSigFig(v) : "")}
            label={{ value: "Cost ($)", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            dataKey="score"
            type="number"
            name="Score"
            domain={[0, "dataMax"] as [number, number | string]}
            label={{ value: "Score", angle: -90, position: "insideLeft" }}
          />
          <ZAxis range={[144, 144]} />
          <ChartTooltip
            cursor={false}
            labelFormatter={(_, payload) => payload?.[0]?.payload.model || null}
            formatter={(value: number | string, name: string) => (
              <span>
                {name}:{" "}
                {typeof value === "number" ? formatSigFig(value) : value}
              </span>
            )}
            content={<ChartTooltipContent />}
          />
          {Object.entries(groups).map(([provider, items]) => (
            <Scatter
              key={provider}
              data={items}
              name={provider}
              fill={PROVIDER_COLORS[provider]}
            />
          ))}
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
