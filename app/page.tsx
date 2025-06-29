import LeaderboardTable from "@/components/leaderboard-table"
import CostScoreChart from "@/components/cost-score-chart"
import NavigationPills from "@/components/navigation-pills"
import Image from "next/image"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Image
            src="/favicon.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span>All the benchmarks!</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Sortable and filterable comparison of LLM performance across key
          benchmarks
        </p>
      </div>
      <NavigationPills />
      <CostScoreChart />
      <LeaderboardTable />
    </main>
  )
}
