import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import ModelCostScoreChart from "@/components/model-cost-score-chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loadLLMData } from "@/lib/data-loader"
import { computeCostDomain } from "@/lib/chart-utils"
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
  const [allModels, benchmarks] = await Promise.all([
    loadLLMData(),
    loadBenchmarks(),
  ])
  const model = allModels.find((m) => m.slug === params.slug)
  if (!model) return notFound()
  const costDomain = computeCostDomain(
    allModels
      .map((m) => m.normalizedCost)
      .filter((v): v is number => v !== undefined),
  )
  const benchNames = benchmarks
    .map((b) => b.benchmark)
    .sort((a, b) => a.localeCompare(b))
  const entries = benchNames.map(
    (name) => [name, model.benchmarks[name]] as const,
  )
  const familyEntries = allModels
    .filter((m) => m.modelSlug === model.modelSlug && m.slug !== model.slug)
    .flatMap((m) =>
      benchNames.map((name) => ({
        model: m.model,
        provider: m.provider,
        benchmark: name,
        result: m.benchmarks[name],
      })),
    )
    .filter((e) => e.result !== undefined)

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <PageHeader title={model.model} subtitle={model.provider} />
      <NavigationPills />
      <ModelCostScoreChart
        provider={model.provider}
        entries={entries
          .filter(([, res]) => res !== undefined)
          .map(([benchmark, res]) => ({ benchmark, result: res! }))}
        familyEntries={familyEntries}
        xDomain={costDomain}
        yDomain={[0, 100]}
        yTicks={[0, 25, 50, 75, 100]}
      />
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
