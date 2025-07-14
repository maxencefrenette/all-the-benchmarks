"use client"

import BenchmarkCostScoreChart from "@/components/benchmark-cost-score-chart"
import LeaderboardToggles from "@/components/leaderboard-toggles"
import type { LLMData } from "@/lib/data-loader"
import { formatSigFig } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import React from "react"
import { useModelFilter } from "@/hooks/use-model-filter"

type Props = {
  llmData: LLMData[]
  benchmark: string
}

export default function BenchmarkSection({ llmData, benchmark }: Props) {
  const { models: visible } = useModelFilter(llmData)

  const entries = React.useMemo(() => {
    const list = visible
      .map((m) => {
        const res = m.benchmarks[benchmark]
        return res
          ? {
              slug: m.slug,
              modelSlug: m.modelSlug,
              reasoningOrder: m.reasoningOrder,
              model: m.model,
              provider: m.provider,
              ...res,
            }
          : null
      })
      .filter(Boolean) as {
      slug: string
      modelSlug: string
      reasoningOrder: number
      model: string
      provider: string
      score: number
      normalizedScore?: number
      normalizedCost?: number
      costPerTask?: number
    }[]
    list.sort((a, b) => b.score - a.score)
    return list
  }, [visible, benchmark])

  return (
    <div className="space-y-4">
      {entries.some((e) => e.costPerTask !== undefined) && (
        <BenchmarkCostScoreChart
          entries={entries.filter((e) => e.costPerTask !== undefined)}
        />
      )}
      <LeaderboardToggles />
      <div className="p-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Raw Score</TableHead>
                <TableHead className="text-right">Normalized Score</TableHead>
                <TableHead className="text-right">Raw Cost</TableHead>
                <TableHead className="text-right">Normalized Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.slug}>
                  <TableCell>{entry.model}</TableCell>
                  <TableCell className="text-right">{entry.score}</TableCell>
                  <TableCell className="text-right">
                    {entry.normalizedScore !== undefined
                      ? entry.normalizedScore.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.costPerTask !== undefined
                      ? formatSigFig(entry.costPerTask)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.normalizedCost !== undefined
                      ? entry.normalizedCost.toFixed(2)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
