import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loadBenchmarks, loadBenchmarkDetails } from "@/lib/benchmark-loader"
import { loadLLMData } from "@/lib/data-loader"
import BenchmarkCostScoreChart from "@/components/benchmark-cost-score-chart"
import { notFound } from "next/navigation"
import { formatSigFig } from "@/lib/utils"

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
  const entries = llms
    .map((m) => {
      const res = m.benchmarks[info.benchmark]
      return res
        ? { slug: m.slug, model: m.model, provider: m.provider, ...res }
        : null
    })
    .filter(Boolean) as {
    slug: string
    model: string
    provider: string
    score: number
    normalizedScore?: number
    normalizedCost?: number
    costPerTask?: number
  }[]
  entries.sort((a, b) => b.score - a.score)

  const chartEntries = entries.filter(
    (e) => e.costPerTask !== undefined && e.costPerTask > 0,
  )

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
      {info.hasCost && chartEntries.length > 0 && (
        <BenchmarkCostScoreChart entries={chartEntries} />
      )}
      <div className="p-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Raw Score</TableHead>
                <TableHead className="text-right">Normalized Score</TableHead>
                <TableHead className="text-right">Raw Cost</TableHead>
                <TableHead className="text-right">Normalized Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.slug}>
                  <TableCell>{entry.model}</TableCell>
                  <TableCell className="text-right">{entry.score}</TableCell>
                  <TableCell className="text-right">
                    {entry.normalizedScore !== undefined
                      ? entry.normalizedScore.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.costPerTask !== undefined
                      ? formatSigFig(entry.costPerTask)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.normalizedCost !== undefined
                      ? entry.normalizedCost.toFixed(2)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
