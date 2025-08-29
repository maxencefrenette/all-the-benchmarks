/**
 * @vitest-environment jsdom
 */

import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import ModelCostScoreChart from "../model-cost-score-chart"
import { type BenchmarkResult } from "@/lib/data-loader"

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value: () => ({
    width: 500,
    height: 500,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON() {},
  }),
})

describe("ModelCostScoreChart", () => {
  test("excludes benchmarks with zero cost and score weights", () => {
    const makeResult = (
      overrides: Partial<BenchmarkResult>,
    ): BenchmarkResult => ({
      score: 0,
      description: "",
      normalizedCost: 1,
      normalizedScore: 1,
      costWeight: 1,
      scoreWeight: 1,
      ...overrides,
    })

    const entries = [
      { benchmark: "a", result: makeResult({}) },
      { benchmark: "b", result: makeResult({ costWeight: 0 }) },
      { benchmark: "c", result: makeResult({ costWeight: 0, scoreWeight: 0 }) },
    ]

    const { container } = render(
      <ModelCostScoreChart
        provider="openai"
        entries={entries}
        xDomain={[0.1, 2]}
      />,
    )

    const dots = container.querySelectorAll('circle[stroke="white"]')
    expect(dots.length).toBe(2)
  })
})
