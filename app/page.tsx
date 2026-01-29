import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex w-full max-w-4xl flex-col gap-12 px-6 py-16 sm:px-8 md:px-12 lg:py-24">
        <header className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
            Accessibility Heuristics Guide
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Core accessibility heuristics for designers and developers
          </p>
        </header>

        <section className="flex flex-col gap-6">
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            This guide provides a comprehensive collection of 37 accessibility
            heuristics organized into 6 key categories. Each heuristic offers
            practical guidance to help you create more accessible digital
            experiences.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CategoryCard
              title="Keyboard Interaction"
              href="/docs/keyboard-interaction"
              count={4}
              description="Navigate and interact using keyboard alone"
            />
            <CategoryCard
              title="Meaningful Content"
              href="/docs/meaningful-content"
              count={7}
              description="Clear, understandable information for all users"
            />
            <CategoryCard
              title="Page Structure"
              href="/docs/page-structure"
              count={6}
              description="Well-organized, semantic document structure"
            />
            <CategoryCard
              title="Quality of Life"
              href="/docs/quality-of-life"
              count={7}
              description="Enhanced usability and user experience"
            />
            <CategoryCard
              title="Readability"
              href="/docs/readability"
              count={6}
              description="Easy to read and comprehend content"
            />
            <CategoryCard
              title="Screen Reader Support"
              href="/docs/screen-reader-support"
              count={7}
              description="Optimized for assistive technologies"
            />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            About This Guide
          </h2>
          <p className="mb-4 text-zinc-700 dark:text-zinc-300">
            These heuristics are based on WCAG guidelines and industry best
            practices. Each heuristic includes practical examples, common
            pitfalls to avoid, and references to relevant standards.
          </p>
          <Link
            href="/docs/keyboard-interaction"
            className="inline-flex items-center text-sm font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
          >
            Get started →
          </Link>
        </section>
      </main>
    </div>
  )
}

function CategoryCard({
  title,
  href,
  count,
  description,
}: {
  title: string
  href: string
  count: number
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-50 dark:group-hover:text-zinc-200">
          {title}
        </h3>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {count}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </Link>
  )
}
