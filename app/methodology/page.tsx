import NavigationPills from "@/components/navigation-pills"

export const metadata = {
  title: "Methodology",
  description: "How leaderboard scores and cost per task are calculated",
}

export default function MethodologyPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <h1 className="text-4xl font-bold text-center">Methodology</h1>
      <p className="text-center text-muted-foreground">
        Explanation of how average scores are computed.
      </p>
      <NavigationPills />
      <div className="space-y-4">
        <p>
          Models are evaluated using a collection of public benchmarks. Raw
          scores are scraped from official leaderboards and documentation.
        </p>
        <p>
          For each benchmark we determine the minimum and maximum score across
          all models. Individual scores are normalised using min–max
          normalisation and then averaged to produce the leaderboard ranking.
        </p>
        <p>
          This approach ensures that benchmarks with different scales contribute
          equally to the final average.
        </p>
        <p>
          Some benchmarks also publish pricing information for completing a
          single task. When available, these values are used to compute a
          <em>Cost Per Task</em> metric shown on the leaderboard.
        </p>
        <p>
          Costs are normalised separately from accuracy scores. Only models with
          prices reported for all cost-enabled benchmarks are considered when
          calculating normalisation factors. For each benchmark the average cost
          across this intersection is inverted and applied as a scaling factor.
        </p>
        <p>
          Each model&rsquo;s cost per task figure is then the mean of its
          normalised costs across the available benchmarks, allowing fair
          comparison across tasks with different price scales.
        </p>
      </div>
    </main>
  )
}
