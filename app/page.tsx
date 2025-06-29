import LeaderboardTable from "@/components/leaderboard-table"
import Link from "next/link"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-4 text-right">
        <Link href="/benchmarks" className="underline">
          Benchmarks
        </Link>
      </div>
      <LeaderboardTable />
    </main>
  )
}
