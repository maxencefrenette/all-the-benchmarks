import LeaderboardTable from "@/components/leaderboard-table"
import NavigationPills from "@/components/navigation-pills"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">LLM Benchmark Leaderboard</h1>
        <p className="text-muted-foreground text-lg">
          Sortable and filterable comparison of LLM performance across key
          benchmarks
        </p>
      </div>
      <NavigationPills />
      <LeaderboardTable />
    </main>
  )
}
