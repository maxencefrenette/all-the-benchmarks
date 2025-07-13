"use client"

import { useSearchParams } from "next/navigation"
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
import { MIN_BENCHMARKS, MIN_COST_BENCHMARKS } from "@/lib/settings"
import React from "react"

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function countCostBenchmarks(llm: LLMData) {
  return Object.values(llm.benchmarks).filter(
    (b) => b.normalizedCost !== undefined,
  ).length
}

type Props = {
  llmData: LLMData[]
  benchmark: string
}

export default function BenchmarkSection({ llmData, benchmark }: Props) {
  const searchParams = useSearchParams()

  const showDeprecated = searchParams.get("deprecated") === "true"
  const showIncomplete = searchParams.get("incomplete") === "true"

  const visible = React.useMemo(
    () =>
      llmData.filter((m) => {
        const isNew =
          m.releaseDate && Date.now() - m.releaseDate.getTime() < ONE_WEEK_MS
        return (
          isNew ||
          ((showDeprecated || !m.deprecated) &&
            (showIncomplete ||
              (Object.keys(m.benchmarks).length >= MIN_BENCHMARKS &&
                countCostBenchmarks(m) >= MIN_COST_BENCHMARKS)))
        )
      }),
    [llmData, showDeprecated, showIncomplete],
  )

  const entries = React.useMemo(() => {
    const list = visible
      .map((m) => {
        const res = m.benchmarks[benchmark]
        return res
          ? { slug: m.slug, model: m.model, provider: m.provider, ...res }
          : null
      })
      .filter(Boolean) as {
      slug: string
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
          entries={
            entries.filter((e) => e.costPerTask !== undefined) as {
              model: string
              provider: string
              score: number
              costPerTask: number
            }[]
          }
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
