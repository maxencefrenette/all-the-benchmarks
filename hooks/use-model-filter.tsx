"use client"

import { useSearchParams } from "next/navigation"
import * as React from "react"
import type { LLMData } from "@/lib/data-loader"
import { MIN_BENCHMARKS, MIN_COST_BENCHMARKS } from "@/lib/settings"

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function countCostBenchmarks(llm: LLMData) {
  return Object.values(llm.benchmarks).filter(
    (b) => b.normalizedCost !== undefined,
  ).length
}

export function useModelFilter(llmData: LLMData[]) {
  const searchParams = useSearchParams()
  const showDeprecated = searchParams.get("deprecated") === "true"
  const showIncomplete = searchParams.get("incomplete") === "true"

  const models = React.useMemo(
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

  return { models, showDeprecated, showIncomplete }
}
