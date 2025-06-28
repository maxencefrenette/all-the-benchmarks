"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Award } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loadLLMData, type LLMData } from "@/lib/data-loader"

export default function Leaderboard() {
  const [llmData, setLlmData] = useState<LLMData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLLMData().then((data) => {
      setLlmData(data)
      setLoading(false)
    })
  }, [])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <div className="h-6 w-6 flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
        )
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading benchmark data...</div>
      </div>
    )
  }

  const benchmarkNames =
    llmData.length > 0 ? Object.keys(llmData[0].benchmarks) : []

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">LLM Benchmark Leaderboard</h1>
        <p className="text-muted-foreground text-lg">
          Comparing performance across {benchmarkNames.length} key benchmarks
        </p>
      </div>

      <div className="grid gap-4">
        {llmData.map((llm, index) => (
          <Card
            key={llm.model}
            className={`transition-all hover:shadow-lg ${index === 0 ? "ring-2 ring-yellow-500" : ""}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div>
                    <CardTitle className="text-xl">{llm.model}</CardTitle>
                    <CardDescription>{llm.provider}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {llm.averageScore?.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Average Score
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {benchmarkNames.map((benchmarkName) => {
                  const benchmark = llm.benchmarks[benchmarkName]
                  return (
                    <div key={benchmarkName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{benchmarkName}</Badge>
                        <span
                          className={`font-semibold ${getScoreColor(benchmark.score)}`}
                        >
                          {benchmark.score}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {benchmark.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benchmark Details</CardTitle>
          <CardDescription>
            Understanding the evaluation metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold">MMLU</h4>
              <p className="text-sm text-muted-foreground">
                Measures knowledge across 57 academic subjects including
                mathematics, history, computer science, and more.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">HellaSwag</h4>
              <p className="text-sm text-muted-foreground">
                Tests commonsense reasoning by asking models to complete
                scenarios with the most logical ending.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">ARC</h4>
              <p className="text-sm text-muted-foreground">
                AI2 Reasoning Challenge focusing on grade-school level science
                questions requiring reasoning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
