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

interface Datum {
  model: string
  cost: number
  score: number
}

type Props = {
  data: Datum[]
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const p = payload[0].payload as Datum
    return (
      <div className="rounded border bg-background p-2 text-xs shadow">
        {p.model}
      </div>
    )
  }
  return null
}

export default function CostScoreChartClient({ data }: Props) {
  if (!data.length) return null
  return (
    <Card className="border-0">
      <CardContent>
        <div className="w-full overflow-x-auto">
          <ScatterChart
            width={600}
            height={300}
            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          >
            <CartesianGrid />
            <XAxis
              dataKey="cost"
              type="number"
              name="Cost"
              scale="log"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <YAxis
              dataKey="score"
              type="number"
              domain={[0, 100]}
              name="Score"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="hsl(240,100%,60%)" />
          </ScatterChart>
        </div>
      </CardContent>
    </Card>
  )
}
