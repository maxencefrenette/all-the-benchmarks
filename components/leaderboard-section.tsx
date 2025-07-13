"use client"

import { useSearchParams } from "next/navigation"
import type { LLMData } from "@/lib/data-loader"
import CostScoreChart from "./cost-score-chart"
import LeaderboardTable from "./leaderboard-table"
import LeaderboardToggles from "./leaderboard-toggles"

const MIN_BENCHMARKS = 5
const MIN_COST_BENCHMARKS = 3
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function countCostBenchmarks(llm: LLMData) {
  return Object.values(llm.benchmarks).filter(
    (b) => b.normalizedCost !== undefined,
  ).length
}

export default function LeaderboardSection({
  llmData,
}: {
  llmData: LLMData[]
}) {
  const searchParams = useSearchParams()

  const showDeprecated = searchParams.get("deprecated") === "true"
  const showIncomplete = searchParams.get("incomplete") === "true"

  const visible = llmData.filter((m) => {
    const isNew =
      m.releaseDate && Date.now() - m.releaseDate.getTime() < ONE_WEEK_MS
    return (
      isNew ||
      ((showDeprecated || !m.deprecated) &&
        (showIncomplete ||
          (Object.keys(m.benchmarks).length >= MIN_BENCHMARKS &&
            countCostBenchmarks(m) >= MIN_COST_BENCHMARKS)))
    )
  })

  return (
    <div className="space-y-4">
      <CostScoreChart
        llmData={llmData}
        showDeprecated={showDeprecated}
        showIncomplete={showIncomplete}
      />
      <LeaderboardToggles />
      <LeaderboardTable llmData={visible} />
    </div>
  )
}
