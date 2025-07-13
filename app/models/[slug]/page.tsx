import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loadLLMData, loadLLMDetails } from "@/lib/data-loader"
import { loadBenchmarks } from "@/lib/benchmark-loader"
import { notFound } from "next/navigation"
import { formatSigFig } from "@/lib/utils"

export async function generateStaticParams() {
  const data = await loadLLMData()
  return data.map((m) => ({ slug: m.slug }))
}

export default async function ModelPage({
  params,
}: {
  params: { slug: string }
}) {
  const [model, benchmarks] = await Promise.all([
    loadLLMDetails(params.slug),
    loadBenchmarks(),
  ])
  if (!model) return notFound()
  const benchNames = benchmarks
    .map((b) => b.benchmark)
    .sort((a, b) => a.localeCompare(b))
  const entries = benchNames.map(
    (name) => [name, model.benchmarks[name]] as const,
  )

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <PageHeader title={model.model} subtitle={model.provider} />
      <NavigationPills />
      <div className="p-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benchmark</TableHead>
                <TableHead className="text-right">Raw Score</TableHead>
                <TableHead className="text-right">Normalized Score</TableHead>
                <TableHead className="text-right">Raw Cost</TableHead>
                <TableHead className="text-right">Normalized Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([name, res]) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell className="text-right">
                    {res?.score !== undefined ? res.score : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {res?.normalizedScore !== undefined
                      ? res.normalizedScore.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {res?.costPerTask !== undefined
                      ? formatSigFig(res.costPerTask)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {res?.normalizedCost !== undefined
                      ? res.normalizedCost.toFixed(2)
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
