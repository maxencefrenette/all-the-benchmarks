import { loadBenchmarks } from "@/lib/benchmark-loader"
import Link from "next/link"
import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"

export const metadata = {
  title: "Benchmarks",
  description: "List of benchmarks used for model evaluation",
}

export default async function BenchmarksPage() {
  const benchmarks = await loadBenchmarks()
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <PageHeader
        title="Benchmarks"
        subtitle="Models are evaluated on the following benchmarks."
      />
      <NavigationPills />
      <ul className="space-y-4">
        {benchmarks.map((b) => (
          <li key={b.slug} className="border rounded-lg p-4">
            <Link href={`/benchmarks/${b.slug}`} className="space-y-1 block">
              <h2 className="font-semibold text-lg">{b.benchmark}</h2>
              {b.description && (
                <p className="text-muted-foreground text-sm">{b.description}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
