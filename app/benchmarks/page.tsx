import { loadBenchmarks } from "@/lib/benchmark-loader"
import Link from "next/link"
import { ChevronRight, CheckCircle, XCircle } from "lucide-react"
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
  const benchmarks = (await loadBenchmarks()).filter(
    (b) => (b.scoreWeight !== 0 || b.costWeight !== 0) && b.modelCount > 0,
  )
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <PageHeader
        title="Benchmarks"
        subtitle="Models are evaluated on the following benchmarks."
      />
      <NavigationPills />
      <div className="p-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benchmark</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>GitHub</TableHead>
                <TableHead className="text-right">Score weight</TableHead>
                <TableHead className="text-right">Cost weight</TableHead>
                <TableHead className="text-right">Models</TableHead>
                <TableHead className="text-right">Cost data?</TableHead>
                <TableHead className="text-right">Private holdout?</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarks.map((b) => (
                <TableRow key={b.slug}>
                  <TableCell className="space-y-1">
                    <div className="font-semibold">{b.benchmark}</div>
                    {b.description && (
                      <p className="text-muted-foreground text-sm">
                        {b.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.website && (
                      <Link
                        href={b.website}
                        target="_blank"
                        className="underline"
                      >
                        Website
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.github && (
                      <Link
                        href={b.github}
                        target="_blank"
                        className="underline"
                      >
                        GitHub
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{b.scoreWeight}</TableCell>
                  <TableCell className="text-right">{b.costWeight}</TableCell>
                  <TableCell className="text-right">{b.modelCount}</TableCell>
                  <TableCell className="text-right">
                    {b.hasCost ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                    )}
                    <span className="sr-only">{b.hasCost ? "Yes" : "No"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.privateHoldout ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                    )}
                    <span className="sr-only">
                      {b.privateHoldout ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/benchmarks/${b.slug}`}
                      className="text-primary underline flex justify-end"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
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
