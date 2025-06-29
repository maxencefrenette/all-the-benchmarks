import { loadBenchmarks } from "@/lib/benchmark-loader"
import Link from "next/link"

export const metadata = {
  title: "Benchmarks",
  description: "List of benchmarks used for model evaluation",
}

export default async function BenchmarksPage() {
  const benchmarks = await loadBenchmarks()
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-4xl font-bold text-center">Benchmarks</h1>
      <p className="text-center text-muted-foreground">
        Models are evaluated on the following benchmarks.
      </p>
      <ul className="space-y-4">
        {benchmarks.map((b) => (
          <li key={b.slug} className="border rounded-lg p-4">
            <h2 className="font-semibold text-lg">{b.benchmark}</h2>
            {b.description && (
              <p className="text-muted-foreground text-sm">{b.description}</p>
            )}
          </li>
        ))}
      </ul>
      <div className="text-center space-x-4">
        <Link href="/" className="underline">
          Back to leaderboard
        </Link>
        <Link href="/methodology" className="underline">
          Methodology
        </Link>
      </div>
    </main>
  )
}
