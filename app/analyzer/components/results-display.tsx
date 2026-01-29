"use client"

import { useMemo, useState } from "react"

import type { AnalysisResult, OwnerFilter } from "@/lib/types/analyzer"
import { Button } from "@/components/ui/button"

import { ExportButton } from "./export-button"
import { HeuristicCard } from "./heuristic-card"

interface ResultsDisplayProps {
  result: AnalysisResult
  onReset: () => void
  onExport: (format: "pdf" | "markdown") => void
  isExporting?: boolean
}

export function ResultsDisplay({
  result,
  onReset,
  onExport,
  isExporting = false,
}: ResultsDisplayProps) {
  const [activeFilter, setActiveFilter] = useState<OwnerFilter>("all")

  // Filter heuristics based on selected owner filter
  const filteredHeuristics = useMemo(() => {
    if (activeFilter === "all") {
      return result.heuristics
    }
    return result.heuristics.filter((heuristic) =>
      heuristic.owner.includes(activeFilter)
    )
  }, [result.heuristics, activeFilter])

  // Group filtered heuristics by category
  const groupedHeuristics = useMemo(() => {
    const groups: Record<string, typeof filteredHeuristics> = {}
    filteredHeuristics.forEach((heuristic) => {
      if (!groups[heuristic.category]) {
        groups[heuristic.category] = []
      }
      groups[heuristic.category].push(heuristic)
    })
    return groups
  }, [filteredHeuristics])

  const categoryNames = Object.keys(groupedHeuristics)
  const hasResults = filteredHeuristics.length > 0

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-2 text-xl font-semibold">Analysis Summary</h2>
        <p className="text-gray-700 dark:text-gray-300">
          {result.detected.summary}
        </p>
        {result.detected.confidence !== undefined && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Confidence: {Math.round(result.detected.confidence * 100)}%
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {result.detected.elements.map((element) => (
            <span
              key={element}
              className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {element.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by:
          </span>
          <div className="flex gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              All ({result.heuristics.length})
            </Button>
            <Button
              variant={activeFilter === "designer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("designer")}
            >
              Designer (
              {
                result.heuristics.filter((h) => h.owner.includes("designer"))
                  .length
              }
              )
            </Button>
            <Button
              variant={activeFilter === "developer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("developer")}
            >
              Developer (
              {
                result.heuristics.filter((h) => h.owner.includes("developer"))
                  .length
              }
              )
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <ExportButton onExport={onExport} isLoading={isExporting} />
          <Button variant="outline" onClick={onReset}>
            Start Over
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {hasResults ? (
        <div className="space-y-8">
          {categoryNames.map((category) => {
            const heuristics = groupedHeuristics[category]
            return (
              <div key={category}>
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {category} ({heuristics.length}{" "}
                  {heuristics.length === 1 ? "heuristic" : "heuristics"})
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {heuristics.map((heuristic) => (
                    <HeuristicCard key={heuristic.slug} heuristic={heuristic} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-gray-600 dark:text-gray-400">
            No heuristics match the selected filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setActiveFilter("all")}
          >
            Clear Filter
          </Button>
        </div>
      )}
    </div>
  )
}
