import LeaderboardSection from "@/components/leaderboard-section"
import { Suspense } from "react"
import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import { loadLLMData } from "@/lib/data-loader"

export default async function Home() {
  const llmData = await loadLLMData()

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <PageHeader
        iconSrc="/favicon.png"
        title="All the benchmarks!"
        subtitle="A single score to compare frontier LLMs"
      />
      <NavigationPills />
      <Suspense>
        <LeaderboardSection llmData={llmData} />
      </Suspense>
    </main>
  )
}
