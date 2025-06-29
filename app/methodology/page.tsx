import NavigationPills from "@/components/navigation-pills"

export const metadata = {
  title: "Methodology",
  description: "How leaderboard scores are calculated",
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
      </div>
    </main>
  )
}
