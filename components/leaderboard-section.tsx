"use client"

import type { LLMData } from "@/lib/data-loader"
import CostScoreChart from "./cost-score-chart"
import LeaderboardTable from "./leaderboard-table"
import LeaderboardToggles from "./leaderboard-toggles"
import { useModelFilter } from "@/hooks/use-model-filter"

export default function LeaderboardSection({
  llmData,
}: {
  llmData: LLMData[]
}) {
  const {
    models: visible,
    showDeprecated,
    showIncomplete,
  } = useModelFilter(llmData)

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
