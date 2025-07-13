import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import BenchmarkSection from "@/components/benchmark-section"
import Link from "next/link"
import { loadBenchmarks, loadBenchmarkDetails } from "@/lib/benchmark-loader"
import { loadLLMData } from "@/lib/data-loader"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  const benches = await loadBenchmarks()
  return benches.map((b) => ({ slug: b.slug }))
}

export default async function BenchmarkPage({
  params,
}: {
  params: { slug: string }
}) {
  const [info, llms] = await Promise.all([
    loadBenchmarkDetails(params.slug),
    loadLLMData(),
  ])
  if (!info) return notFound()
  const relevant = llms.filter((m) => m.benchmarks[info.benchmark])

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <PageHeader title={info.benchmark} subtitle={info.description} />
      {(info.website || info.github) && (
        <div className="flex justify-center gap-4 text-sm">
          {info.website && (
            <Link href={info.website} target="_blank" className="underline">
              Website
            </Link>
          )}
          {info.github && (
            <Link href={info.github} target="_blank" className="underline">
              GitHub
            </Link>
          )}
        </div>
      )}
      <NavigationPills />
      <BenchmarkSection llmData={relevant} benchmark={info.benchmark} />
    </main>
  )
}
