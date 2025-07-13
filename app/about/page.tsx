import NavigationPills from "@/components/navigation-pills"
import PageHeader from "@/components/page-header"
import Link from "next/link"

export const metadata = {
  title: "About",
  description: "Project goals and how leaderboard scores are calculated",
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <PageHeader
        title="About"
        subtitle="Overview of this project and how average scores are computed."
      />
      <NavigationPills />
      <div className="space-y-6">
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Goal</h2>
          <p>
            The purpose of this leaderboard is not to crown the best language
            model for a specific task. Instead it aggregates results from
            popular benchmarks so you can quickly see which lab is currently
            ahead across the evaluations that the community follows.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Methodology</h2>
          <p>
            Models are evaluated using a collection of public benchmarks. Raw
            scores are scraped from official leaderboards and documentation.
          </p>
          <p>
            For each benchmark we determine the minimum and maximum score across
            all models. Individual scores are normalised using min–max
            normalisation and then averaged to produce the leaderboard ranking.
          </p>
          <pre className="font-mono text-sm bg-muted p-4 rounded">
            normalized<sub>i,j</sub> = (score<sub>i,j</sub> − min<sub>j</sub>) /
            (max<sub>j</sub> − min<sub>j</sub>){"\n"}average<sub>i</sub> = (1 /
            B)∑<sub>j</sub> normalized<sub>i,j</sub>× 100
          </pre>
          <p>
            This approach ensures that benchmarks with different scales
            contribute equally to the final average.
          </p>
          <p>
            Some benchmarks also publish pricing information for completing a
            single task. When available, these values are used to compute a{" "}
            <em>Cost Per Task</em> metric shown on the leaderboard.
          </p>
          <p>
            Costs are normalised separately from accuracy scores. Because many
            leaderboards omit pricing for some models, we fit a rank‑1 matrix
            factorisation using singular value decomposition to estimate a
            weight for each benchmark. Each model&rsquo;s cost is multiplied by
            the inverse of this weight before averaging.
          </p>
          <pre className="font-mono text-sm bg-muted p-4 rounded">
            factor<sub>j</sub> = 1 / u<sub>j</sub>
            {"\n"}cost′<sub>i,j</sub> = cost<sub>i,j</sub> × factor<sub>j</sub>
            {"\n"}CPT<sub>i</sub> = (1 / B)∑<sub>j</sub> cost′<sub>i,j</sub>
          </pre>
          <p>
            Each model&rsquo;s cost per task figure is then the mean of its
            normalised costs across the available benchmarks, allowing fair
            comparison across tasks with different price scales.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-2xl font-semibold">Why Cost Per Task?</h2>
          <p>
            Pricing is often reported per thousand output tokens, but the amount
            of text produced by different benchmarks varies widely.{" "}
            <Link
              href="https://epoch.ai/data-insights/output-length"
              target="_blank"
              className="underline"
            >
              Epoch AI&rsquo;s analysis
            </Link>{" "}
            highlights just how large these differences can be.
          </p>
          <p>
            Expressing prices as a total cost per task avoids distorted
            comparisons and reflects a better estimate of how much these models
            cost to run on real-world tasks.
          </p>
        </section>
      </div>
    </main>
  )
}
