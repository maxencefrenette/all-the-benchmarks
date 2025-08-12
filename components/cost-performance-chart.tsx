"use client"

import React from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart"
import { PROVIDER_COLORS } from "@/lib/provider-colors"
import { formatSigFig } from "@/lib/utils"

const BASE_TICKS = [
  0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000, 3000, 10000,
] as const

// Default radius for dots derived from the ZAxis range
const DEFAULT_RADIUS = Math.sqrt(144 / Math.PI)

export type CostPerformanceEntry = {
  label: string
  provider: string
  cost: number
  score: number
  connectKey?: string
  meta?: unknown
}

type Props = {
  entries: CostPerformanceEntry[]
  xLabel: string
  yLabel: string
  renderTooltip?: (entry: CostPerformanceEntry) => React.ReactNode
  getExtraTooltipEntries?: (
    entry: CostPerformanceEntry,
  ) => { name: string; value: number | string }[]
  xDomain?: [number, number]
  yDomain?: [number, number] | ["dataMin", "dataMax"]
  yTicks?: number[]
  xScale?: "log" | "linear"
}

type DotProps = {
  cx: number
  cy: number
  payload: CostPerformanceEntry
  fill: string
}

export default function CostPerformanceChart({
  entries,
  xLabel,
  yLabel,
  renderTooltip,
  getExtraTooltipEntries,
  xDomain,
  yDomain,
  yTicks,
  xScale = "log",
}: Props) {
  const data = React.useMemo(() => entries.filter((e) => e.cost > 0), [entries])

  const groups = React.useMemo(() => {
    const map: Record<string, CostPerformanceEntry[]> = {}
    for (const item of data) {
      if (!map[item.provider]) map[item.provider] = []
      map[item.provider].push(item)
    }
    return map
  }, [data])

  const lineGroups = React.useMemo(() => {
    const map: Record<string, CostPerformanceEntry[]> = {}
    for (const item of data) {
      if (!item.connectKey) continue
      if (!map[item.connectKey]) map[item.connectKey] = []
      map[item.connectKey].push(item)
    }
    for (const items of Object.values(map)) {
      items.sort((a, b) => {
        const aOrder =
          (a.meta as { reasoningOrder?: number })?.reasoningOrder ?? 0
        const bOrder =
          (b.meta as { reasoningOrder?: number })?.reasoningOrder ?? 0
        return aOrder - bOrder
      })
    }
    return map
  }, [data])

  const [hoverKey, setHoverKey] = React.useState<string | null>(null)

  /**
   * Recharts generates a "nice" domain and tick set for linear scales, so we
   * leave `costDomain` undefined and let the library handle it. For log scales
   * we compute a padded domain around the data so we can later filter the base
   * logarithmic ticks to those that fall within range.
   */
  const costDomain = React.useMemo<
    [number | "auto", number | "auto"] | undefined
  >(() => {
    if (xDomain) return xDomain
    if (xScale === "linear") return undefined
    const FACTOR = 1.2
    let min = Infinity
    let max = -Infinity
    for (const item of data) {
      min = Math.min(min, item.cost)
      max = Math.max(max, item.cost)
    }
    if (!isFinite(min) || !isFinite(max)) return [0, 1]
    return [min / FACTOR, max * FACTOR]
  }, [data, xDomain, xScale])

  /**
   * In linear mode we rely on Recharts' default tick generator. For log scales
   * we filter a set of base ticks down to those that fit within the computed
   * domain.
   */
  const ticks = React.useMemo(() => {
    if (
      xScale === "log" &&
      costDomain &&
      typeof costDomain[0] === "number" &&
      typeof costDomain[1] === "number"
    ) {
      return BASE_TICKS.filter((t) => t >= costDomain[0] && t <= costDomain[1])
    }
    return undefined
  }, [costDomain, xScale])

  const renderDot = React.useCallback(
    (props: DotProps) => {
      const { cx, cy, payload, fill } = props
      const key = payload.connectKey ?? payload.label
      const r = hoverKey === key ? DEFAULT_RADIUS + 4 : DEFAULT_RADIUS
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke="white"
          strokeWidth={1}
          onMouseEnter={() => setHoverKey(key)}
          onMouseLeave={() => setHoverKey(null)}
        />
      )
    },
    [hoverKey],
  )

  if (!data.length) return null

  return (
    <div className="p-6 pt-0">
      <ChartContainer
        config={{
          cost: { label: xLabel },
          score: { label: yLabel },
        }}
      >
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <XAxis
            dataKey="cost"
            type="number"
            name="Cost"
            scale={xScale}
            {...(costDomain ? { domain: costDomain } : {})}
            {...(ticks ? { ticks } : {})}
            tickFormatter={(v) => (v ? formatSigFig(v) : "")}
            label={{ value: xLabel, position: "insideBottom", offset: -10 }}
          />
          <YAxis
            dataKey="score"
            type="number"
            name="Score"
            domain={
              (yDomain ?? ["dataMin", "dataMax"]) as [
                number | "dataMin" | "dataMax",
                number | "dataMax" | "dataMin",
              ]
            }
            {...(yTicks ? { ticks: yTicks } : {})}
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
          />
          <ZAxis range={[144, 144]} />
          <ChartTooltip
            cursor={false}
            labelFormatter={(_, payload) => {
              const entry = payload?.[0]?.payload as CostPerformanceEntry
              return renderTooltip ? renderTooltip(entry) : entry?.label || null
            }}
            formatter={(value: number | string, name: string) => (
              <span>
                {name}:{" "}
                {typeof value === "number" ? formatSigFig(value) : value}
              </span>
            )}
            content={(props) => {
              const entry = props.payload?.[0]?.payload as CostPerformanceEntry
              const extra =
                entry && getExtraTooltipEntries
                  ? getExtraTooltipEntries(entry).map((e) => ({
                      ...(props.payload?.[0] ?? {}),
                      name: e.name,
                      dataKey: e.name,
                      value: e.value,
                    }))
                  : []
              return (
                <ChartTooltipContent
                  {...props}
                  payload={
                    props.payload ? [...props.payload, ...extra] : props.payload
                  }
                />
              )
            }}
          />
          {Object.entries(groups).map(([provider, items]) => (
            <Scatter
              key={provider}
              data={items}
              name={provider}
              fill={PROVIDER_COLORS[provider]}
              shape={renderDot}
              isAnimationActive={false}
            />
          ))}
          {Object.entries(lineGroups).map(([key, items]) =>
            items.length > 1 ? (
              <Scatter
                key={`line-${key}`}
                data={items}
                name={key}
                fill={PROVIDER_COLORS[items[0].provider]}
                line={{
                  strokeDasharray: "4 4",
                  stroke: PROVIDER_COLORS[items[0].provider],
                  strokeWidth: hoverKey === key ? 3 : 1,
                }}
                shape={() => <></>}
                isAnimationActive={false}
              />
            ) : null,
          )}
        </ScatterChart>
      </ChartContainer>
    </div>
  )
}
