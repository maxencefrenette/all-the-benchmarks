"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from "recharts"
import { LLMData } from "@/lib/data-loader"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"

type Props = {
  llmData: LLMData[]
}

export default function CostScoreChart({ llmData }: Props) {
  if (!llmData.length) return null

  return (
    <ChartContainer
      config={{
        normalizedCost: { label: "Cost" },
        averageScore: { label: "Score" },
      }}
    >
      <ScatterChart
        width={600}
        height={300}
        margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
      >
        <CartesianGrid />
        <XAxis
          dataKey="normalizedCost"
          type="number"
          name="Cost"
          scale="log"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v) => v && v.toFixed(2)}
        />
        <YAxis
          dataKey="averageScore"
          type="number"
          domain={[0, 100]}
          name="Score"
        />
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
        <Scatter data={llmData} fill="hsl(240,100%,60%)" />
      </ScatterChart>
    </ChartContainer>
  )
}
