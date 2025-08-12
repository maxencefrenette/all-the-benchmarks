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
            Scores are not normalised with simple min–max scaling. Instead we
            fit a joint sigmoid model across all benchmarks. Each model
            <em>i</em> is assigned a latent ability <em>a</em>
            <sub>i</sub> and each benchmark <em>j</em> receives parameters for
            its minimum, maximum, midpoint and slope. The expected score is
            given by:
          </p>
          <pre className="font-mono text-sm bg-muted p-4 rounded">
            E[score<sub>i,j</sub>] = min<sub>j</sub> + (max<sub>j</sub> - min
            <sub>j</sub>) / (1 + exp(-(a<sub>i</sub> - midpoint<sub>j</sub>) /
            slope<sub>j</sub>))
            <br />
            average<sub>i</sub> = sigmoid(a<sub>i</sub>) × 100
          </pre>
          <p>
            The fitted abilities are transformed to a 0–100 scale using a fixed
            sigmoid, providing a stable comparison even when raw benchmark
            ranges differ.
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
            <br />
            cost′<sub>i,j</sub> = cost<sub>i,j</sub> × factor<sub>j</sub>
            <br />
            CPT<sub>i</sub> = (1 / B)∑<sub>j</sub> cost′<sub>i,j</sub>
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
