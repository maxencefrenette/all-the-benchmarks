import NavigationPills from "@/components/navigation-pills"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { loadLLMData, loadLLMDetails } from "@/lib/data-loader"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  const data = await loadLLMData()
  return data.map((m) => ({ slug: m.slug }))
}

export default async function ModelPage({
  params,
}: {
  params: { slug: string }
}) {
  const model = await loadLLMDetails(params.slug)
  if (!model) return notFound()
  const entries = Object.entries(model.benchmarks).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-4xl font-bold text-center">{model.model}</h1>
      <p className="text-center text-muted-foreground">{model.provider}</p>
      <NavigationPills />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Benchmark</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([name, res]) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell className="text-right">{res.score}</TableCell>
              <TableCell className="text-right">
                {res.costPerTask !== undefined
                  ? res.costPerTask.toFixed(2)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  )
}
