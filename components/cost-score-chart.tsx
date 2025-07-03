"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Symbols,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { LLMData } from "@/lib/data-loader"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"

type Props = {
  llmData: LLMData[]
}

export default function CostScoreChart({ llmData }: Props) {
  if (!llmData.length) return null

  return (
    <Card className="border-0">
      <CardContent>
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
              formatter={(value: number) =>
                typeof value === "number" ? value.toFixed(2) : value
              }
              content={<ChartTooltipContent />}
            />
            <Scatter
              data={llmData}
              fill="hsl(240,100%,60%)"
              shape={(props) => {
                const { payload, ...rest } = props as typeof props & {
                  payload: LLMData & { hidden?: boolean }
                }
                if (payload.hidden) return null
                return <Symbols {...rest} type="circle" />
              }}
            />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
