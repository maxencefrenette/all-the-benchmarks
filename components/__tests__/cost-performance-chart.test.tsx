/**
 * @vitest-environment jsdom
 */

import React from "react"
import { render, fireEvent } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import CostPerformanceChart, {
  type CostPerformanceEntry,
} from "../cost-performance-chart"

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

const entries: CostPerformanceEntry[] = [
  { label: "A1", provider: "openai", cost: 1, score: 1, connectKey: "g1" },
  { label: "A2", provider: "openai", cost: 2, score: 2, connectKey: "g1" },
  { label: "B1", provider: "anthropic", cost: 1, score: 1 },
]

const defaultRadius = Math.sqrt(144 / Math.PI)

describe("CostPerformanceChart hover interactions", () => {
  test("hovering over a grouped dot highlights all group members and line", () => {
    const { container } = render(
      <CostPerformanceChart entries={entries} xLabel="Cost" yLabel="Score" />,
    )

    // our dots are circles with white stroke
    const dots = container.querySelectorAll('circle[stroke="white"]')
    expect(dots.length).toBe(3)

    fireEvent.mouseEnter(dots[0])

    // both dots in the group enlarge
    expect(parseFloat(dots[0].getAttribute("r") || "")).toBeCloseTo(
      defaultRadius + 4,
    )
    expect(parseFloat(dots[1].getAttribute("r") || "")).toBeCloseTo(
      defaultRadius + 4,
    )
    // unrelated dot remains default size
    expect(parseFloat(dots[2].getAttribute("r") || "")).toBeCloseTo(
      defaultRadius,
    )

    const line = container.querySelector('path[stroke-dasharray="4 4"]')
    expect(line).not.toBeNull()
    expect(parseFloat(line!.getAttribute("stroke-width") || "")).toBe(3)
  })

  test("hovering over an ungrouped dot only highlights itself", () => {
    const { container } = render(
      <CostPerformanceChart entries={entries} xLabel="Cost" yLabel="Score" />,
    )
    const dots = container.querySelectorAll('circle[stroke="white"]')

    fireEvent.mouseEnter(dots[2])

    // only the hovered dot enlarges
    expect(parseFloat(dots[2].getAttribute("r") || "")).toBeCloseTo(
      defaultRadius + 4,
    )
    expect(parseFloat(dots[0].getAttribute("r") || "")).toBeCloseTo(
      defaultRadius,
    )
    expect(parseFloat(dots[1].getAttribute("r") || "")).toBeCloseTo(
      defaultRadius,
    )

    const line = container.querySelector('path[stroke-dasharray="4 4"]')
    expect(line).not.toBeNull()
    expect(parseFloat(line!.getAttribute("stroke-width") || "")).toBe(1)
  })
})

test("linear scale uses clean, auto-generated ticks", () => {
  const linearEntries: CostPerformanceEntry[] = [
    { label: "L1", provider: "openai", cost: 55.55, score: 1 },
    { label: "L2", provider: "openai", cost: 123.45, score: 2 },
    { label: "L3", provider: "openai", cost: 188.88, score: 3 },
  ]
  const { container } = render(
    <CostPerformanceChart
      entries={linearEntries}
      xLabel="Cost"
      yLabel="Score"
      xScale="linear"
    />,
  )
  const ticks = Array.from(
    container.querySelectorAll(
      ".recharts-xAxis .recharts-cartesian-axis-tick text",
    ),
  ).map((t) => parseFloat(t.textContent || ""))
  expect(ticks.length).toBeGreaterThan(0)

  const maxCost = Math.max(...linearEntries.map((e) => e.cost))
  expect(Math.max(...ticks)).toBeLessThanOrEqual(maxCost * 1.1)

  for (const t of ticks) {
    expect(Number.isFinite(t)).toBe(true)
    expect(Math.abs(t - Math.round(t))).toBeLessThan(1e-6)
  }
})
