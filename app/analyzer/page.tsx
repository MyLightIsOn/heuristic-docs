import { Settings } from "@/types/settings"
import { AnalyzerClient } from "./components/analyzer-client"

export const metadata = {
  title: `Component Analyzer - ${Settings.title}`,
  description:
    "Analyze your components and get relevant accessibility heuristics to consider.",
  openGraph: {
    title: `Component Analyzer - ${Settings.openGraph.title}`,
    description:
      "Analyze your components and get relevant accessibility heuristics to consider.",
    url: `${Settings.metadataBase}/analyzer`,
    siteName: Settings.openGraph.siteName,
    type: "website",
    images: Settings.openGraph.images.map((image) => ({
      ...image,
      url: `${Settings.metadataBase}${image.url}`,
    })),
  },
  twitter: {
    title: `Component Analyzer - ${Settings.twitter.title}`,
    description:
      "Analyze your components and get relevant accessibility heuristics to consider.",
    card: Settings.twitter.card,
    site: Settings.twitter.site,
    images: Settings.twitter.images.map((image) => ({
      ...image,
      url: `${Settings.metadataBase}${image.url}`,
    })),
  },
  alternates: {
    canonical: `${Settings.metadataBase}/analyzer`,
  },
}

export default function AnalyzerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex w-full flex-col gap-8 px-6 py-16 sm:px-8 md:px-12 lg:py-24">
        <header className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              Component Analyzer
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Get personalized accessibility recommendations for your components
            </p>
          </div>

          <div className="mt-6 space-y-3 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              How it works
            </h2>
            <ol className="ml-5 list-decimal space-y-2 text-zinc-700 dark:text-zinc-300">
              <li>
                Choose your input method: select UI elements, upload a design
                screenshot, or describe your component
              </li>
              <li>
                Our AI-powered analyzer identifies the component type and
                relevant elements
              </li>
              <li>
                Get a curated list of accessibility heuristics specific to your
                component
              </li>
              <li>
                Filter by role (designer/developer) and export as a checklist
              </li>
            </ol>
          </div>
        </header>

        <section className="mx-auto w-full max-w-6xl">
          <AnalyzerClient />
        </section>
      </main>
    </div>
  )
}
