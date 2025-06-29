import CostScoreChartClient from "./cost-score-chart-client"
import { loadLLMData } from "@/lib/data-loader"

export default async function CostScoreChart() {
  const llmData = await loadLLMData()
  const chartData = llmData
    .filter((m) => m.normalizedCost !== undefined && m.normalizedCost !== null)
    .map((m) => ({
      model: m.model,
      cost: m.normalizedCost as number,
      score: m.averageScore ?? 0,
    }))

  return <CostScoreChartClient data={chartData} />
}
