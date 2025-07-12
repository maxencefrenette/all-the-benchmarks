"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { LLMData } from "@/lib/data-loader"
import CostScoreChart from "./cost-score-chart"
import LeaderboardTable from "./leaderboard-table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
  const router = useRouter()
  const pathname = usePathname()

  const showDeprecated = searchParams.get("deprecated") === "true"
  const showIncomplete = searchParams.get("incomplete") === "true"

  const updateParam = (key: string, value: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, "true")
    } else {
      params.delete(key)
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }
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
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <Switch
            id="deprecated-toggle"
            checked={showDeprecated}
            onCheckedChange={(checked) => updateParam("deprecated", checked)}
          />
          <Label htmlFor="deprecated-toggle">Show deprecated models</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="incomplete-toggle"
            checked={showIncomplete}
            onCheckedChange={(checked) => updateParam("incomplete", checked)}
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
