"use client"

import { useSearchParams } from "next/navigation"
import * as React from "react"
import type { LLMData } from "@/lib/data-loader"
import {
  MIN_BENCHMARKS,
  MIN_COST_BENCHMARKS,
  MIN_NEW_MODEL_BENCHMARKS,
  MIN_NEW_MODEL_COST_BENCHMARKS,
} from "@/lib/settings"

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
        const benchmarkCount = Object.keys(m.benchmarks).length
        const costCount = countCostBenchmarks(m)
        return (
          (isNew &&
            benchmarkCount >= MIN_NEW_MODEL_BENCHMARKS &&
            costCount >= MIN_NEW_MODEL_COST_BENCHMARKS) ||
          ((showDeprecated || !m.deprecated) &&
            (showIncomplete ||
              (benchmarkCount >= MIN_BENCHMARKS &&
                costCount >= MIN_COST_BENCHMARKS)))
        )
      }),
    [llmData, showDeprecated, showIncomplete],
  )

  return { models, showDeprecated, showIncomplete }
}
