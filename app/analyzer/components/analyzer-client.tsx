"use client"

import { useState } from "react"
import { saveAs } from "file-saver"

import {
  generateMarkdownChecklist,
  generatePDFChecklist,
} from "@/lib/analyzer/export-generator"
import { matchHeuristics } from "@/lib/analyzer/heuristic-matcher"
import type {
  AnalysisInput,
  AnalysisResult,
  DetectedComponent,
} from "@/lib/types/analyzer"

import { InputTabs } from "./input-tabs"
import { ResultsDisplay } from "./results-display"

/**
 * Main analyzer client component that orchestrates the entire analysis flow.
 *
 * This component manages:
 * - Input collection (elements, image, or description)
 * - API communication for AI-powered analysis
 * - Heuristic matching against detected components
 * - Results display with filtering
 * - Export functionality (PDF and Markdown)
 * - Error handling and loading states
 *
 * State flow:
 * 1. Initial: Show InputTabs for user to select input method
 * 2. User submits: Call API → Set loading → Get detected components → Match heuristics
 * 3. Results: Hide input, show ResultsDisplay with matched heuristics
 * 4. Reset: Clear results, show InputTabs again
 */
export function AnalyzerClient() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles the analyze action based on the input method.
   *
   * For 'elements' method:
   * - Directly calls matchHeuristics with the selected elements
   * - No API call needed
   *
   * For 'image' or 'description' methods:
   * - Calls /api/analyzer to get AI-detected elements
   * - Then calls matchHeuristics with detected elements
   *
   * @param input - The analysis input containing method and data
   */
  const handleAnalyze = async (input: AnalysisInput) => {
    setIsLoading(true)
    setError(null)

    try {
      let detected: DetectedComponent

      // For element picker, directly use the selected elements
      if (input.method === "elements" && input.data.elements) {
        detected = {
          summary: `Component with ${input.data.elements.length} selected element${input.data.elements.length === 1 ? "" : "s"}`,
          elements: input.data.elements,
        }

        // Match heuristics based on selected elements
        const heuristics = await matchHeuristics(input.data.elements)

        setAnalysisResult({
          detected,
          heuristics,
        })
      }
      // For image or description, call the API to detect elements
      else if (input.method === "image" && input.data.image) {
        // Create FormData for image upload
        const formData = new FormData()
        formData.append("image", input.data.image)

        const response = await fetch("/api/analyzer", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to analyze image")
        }

        const data = await response.json()
        detected = data.detected

        // Match heuristics based on detected elements
        const heuristics = await matchHeuristics(detected.elements)

        setAnalysisResult({
          detected,
          heuristics,
        })
      } else if (input.method === "description" && input.data.description) {
        // Send description to API
        const response = await fetch("/api/analyzer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: input.data.description,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to analyze description")
        }

        const data = await response.json()
        detected = data.detected

        // Match heuristics based on detected elements
        const heuristics = await matchHeuristics(detected.elements)

        setAnalysisResult({
          detected,
          heuristics,
        })
      } else {
        throw new Error("Invalid input method or missing data")
      }
    } catch (err) {
      console.error("Error during analysis:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during analysis"
      )
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the reset action.
   * Clears the analysis result and error state, returning to input view.
   */
  const handleReset = () => {
    setAnalysisResult(null)
    setError(null)
  }

  /**
   * Handles export functionality for both PDF and Markdown formats.
   *
   * Generates the file, creates a download filename with current date,
   * and triggers the download using file-saver.
   *
   * Filename format: a11y-checklist-YYYY-MM-DD.{md|pdf}
   *
   * @param format - The export format ('pdf' or 'markdown')
   */
  const handleExport = async (format: "pdf" | "markdown") => {
    if (!analysisResult) {
      console.error("No analysis result to export")
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      // Generate filename with current date
      const today = new Date()
      const dateString = today.toISOString().split("T")[0] // YYYY-MM-DD
      const filename = `a11y-checklist-${dateString}.${format === "pdf" ? "pdf" : "md"}`

      if (format === "pdf") {
        // Generate PDF
        const pdfBlob = await generatePDFChecklist(analysisResult)
        saveAs(pdfBlob, filename)
      } else {
        // Generate Markdown
        const markdown = generateMarkdownChecklist(analysisResult)
        const blob = new Blob([markdown], { type: "text/markdown" })
        saveAs(blob, filename)
      }
    } catch (err) {
      console.error("Error during export:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during export"
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <h3 className="mb-1 font-semibold">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results or Input View */}
      {analysisResult ? (
        <ResultsDisplay
          result={analysisResult}
          onReset={handleReset}
          onExport={handleExport}
          isExporting={isExporting}
        />
      ) : (
        <InputTabs onAnalyze={handleAnalyze} isLoading={isLoading} />
      )}
    </div>
  )
}
