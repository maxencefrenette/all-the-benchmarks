"use client"

import { useMemo, useState } from "react"
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
  const sorted = useMemo(
    () => [...llmData].sort((a, b) => a.slug.localeCompare(b.slug)),
    [llmData],
  )

  const chartData = useMemo(
    () =>
      sorted.map((m) =>
        showDeprecated || !m.deprecated ? m : { ...m, hidden: true },
      ),
    [sorted, showDeprecated],
  )

  const tableData = showDeprecated
    ? sorted
    : sorted.filter((m) => !m.deprecated)

  return (
    <div className="space-y-4">
      <CostScoreChart llmData={chartData} />
      <div className="flex items-center justify-center gap-2">
        <Switch
          id="deprecated-toggle"
          checked={showDeprecated}
          onCheckedChange={setShowDeprecated}
        />
        <Label htmlFor="deprecated-toggle">Show deprecated models</Label>
      </div>
      <LeaderboardTable llmData={tableData} />
    </div>
  )
}
