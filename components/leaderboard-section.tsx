"use client"

import { useState } from "react"
import type { LLMData } from "@/lib/data-loader"
import CostScoreChart from "./cost-score-chart"
import LeaderboardTable from "./leaderboard-table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function LeaderboardSection({
  llmData,
}: {
  llmData: LLMData[]
}) {
  const [showDeprecated, setShowDeprecated] = useState(false)
  const [showIncomplete, setShowIncomplete] = useState(false)
  const visible = llmData.filter(
    (m) =>
      (showDeprecated || !m.deprecated) &&
      (showIncomplete || Object.keys(m.benchmarks).length >= 5),
  )

  return (
    <div className="space-y-4">
      <CostScoreChart
        llmData={llmData}
        showDeprecated={showDeprecated}
        showIncomplete={showIncomplete}
      />
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id="deprecated-toggle"
            checked={showDeprecated}
            onCheckedChange={setShowDeprecated}
          />
          <Label htmlFor="deprecated-toggle">Show deprecated models</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="incomplete-toggle"
            checked={showIncomplete}
            onCheckedChange={setShowIncomplete}
          />
          <Label htmlFor="incomplete-toggle">
            Show models with limited data
          </Label>
        </div>
      </div>
      <LeaderboardTable llmData={visible} />
    </div>
  )
}
