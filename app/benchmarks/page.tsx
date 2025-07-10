import { loadBenchmarks } from "@/lib/benchmark-loader"
import Link from "next/link"
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Benchmark</TableHead>
            <TableHead className="text-right">Models</TableHead>
            <TableHead className="text-right">Cost data?</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {benchmarks.map((b) => (
            <TableRow key={b.slug}>
              <TableCell>
                <Link
                  href={`/benchmarks/${b.slug}`}
                  className="space-y-1 block"
                >
                  <div className="font-semibold">{b.benchmark}</div>
                  {b.description && (
                    <p className="text-muted-foreground text-sm">
                      {b.description}
                    </p>
                  )}
                </Link>
              </TableCell>
              <TableCell className="text-right">{b.modelCount}</TableCell>
              <TableCell className="text-right">
                {b.hasCost ? "Yes" : "No"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  )
}
