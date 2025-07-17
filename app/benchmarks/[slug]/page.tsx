import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import BenchmarkSection from "@/components/benchmark-section"
import { Suspense } from "react"
import Link from "next/link"
import { Globe, Github } from "lucide-react"
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
        <div className="flex justify-center gap-2">
          {info.website && (
            <Link
              href={info.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Website</span>
            </Link>
          )}
          {info.github && (
            <Link
              href={info.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          )}
        </div>
      )}
      <NavigationPills />
      <Suspense>
        <BenchmarkSection llmData={relevant} benchmark={info.benchmark} />
      </Suspense>
    </main>
  )
}
