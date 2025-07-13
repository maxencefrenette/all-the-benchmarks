"use client"

import React from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis } from "recharts"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { formatSigFig } from "@/lib/utils"

const BASE_TICKS = [
  0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000,
] as const

export type BenchmarkEntry = {
  provider: string
  model: string
  score: number
  costPerTask: number
}

export default function BenchmarkCostScoreChart({
  entries,
}: {
  entries: BenchmarkEntry[]
}) {
  const data = React.useMemo(
    () =>
      entries.filter(
        (e) => e.costPerTask !== undefined && !Number.isNaN(e.costPerTask),
      ),
    [entries],
  )

  const groups = React.useMemo(() => {
    const map: Record<string, BenchmarkEntry[]> = {}
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

  const scoreDomain = React.useMemo(() => {
    const FACTOR = 1.1
    let min = Infinity
    let max = -Infinity
    for (const item of data) {
      min = Math.min(min, item.score)
      max = Math.max(max, item.score)
    }
    if (!isFinite(min) || !isFinite(max)) return [0, 1]
    const padding = (max - min) * (FACTOR - 1)
    return [min - padding, max + padding]
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
            domain={scoreDomain as [number, number]}
            name="Score"
            label={{ value: "Score", angle: -90, position: "insideLeft" }}
          />
          <ZAxis range={[144, 144]} />
          <ChartTooltip
            cursor={false}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as BenchmarkEntry
              return item ? item.model : null
            }}
            itemSorter={(item) => {
              const order: Record<string, number> = { Score: 0, "Cost ($)": 1 }
              return order[item.name as string] ?? 0
            }}
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
