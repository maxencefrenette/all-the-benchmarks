"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { LLMData } from "@/lib/data-loader"
import { ChartContainer } from "./ui/chart"

type Props = {
  llmData: LLMData[]
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const p = payload[0].payload as LLMData
    return (
      <div className="rounded border bg-background p-2 text-xs shadow">
        {p.model}
      </div>
    )
  }
  return null
}

export default function CostScoreChart({ llmData }: Props) {
  if (!llmData.length) return null

  return (
    <Card className="border-0">
      <CardContent>
        <ChartContainer config={{}}>
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
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={llmData} fill="hsl(240,100%,60%)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
