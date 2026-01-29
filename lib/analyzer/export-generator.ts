import { url } from "@/settings/main"
import { jsPDF } from "jspdf"

import type { AnalysisResult } from "@/lib/types/analyzer"

/**
 * Generates a Markdown checklist from analysis results.
 *
 * Creates a formatted Markdown document with:
 * - Title and metadata (generation timestamp, component summary)
 * - Heuristics grouped by category
 * - Checkboxes for tracking completion
 * - Links to full heuristic guides
 *
 * The generated Markdown can be downloaded or copied for use in project management
 * tools, documentation, or as a personal checklist.
 *
 * @param result - The analysis result containing detected components and matched heuristics
 * @returns Formatted Markdown string ready for download or display
 *
 * @example
 * ```typescript
 * const markdown = generateMarkdownChecklist({
 *   detected: {
 *     summary: "Login form with 2 text inputs, 1 button",
 *     elements: ["text-input", "button"]
 *   },
 *   heuristics: [
 *     {
 *       slug: "/keyboard-interaction/visible-focus",
 *       category: "keyboard-interaction",
 *       title: "Is the focus indicator clearly visible...",
 *       owner: ["designer", "developer"],
 *       keywords: ["focus", "keyboard"],
 *       preview: "When someone navigates..."
 *     }
 *   ]
 * })
 * // Returns formatted Markdown checklist
 * ```
 */
export function generateMarkdownChecklist(result: AnalysisResult): string {
  const { detected, heuristics } = result

  // Format timestamp as YYYY-MM-DD
  const today = new Date()
  const timestamp = today.toISOString().split("T")[0]

  // Start building the Markdown document
  let markdown = "# Accessibility Heuristics Checklist\n\n"
  markdown += `Generated: ${timestamp}\n`
  markdown += `Component: ${detected.summary}\n\n`

  // Group heuristics by category
  const categorizedHeuristics = new Map<string, typeof heuristics>()

  for (const heuristic of heuristics) {
    const categorySlug = heuristic.category
    if (!categorizedHeuristics.has(categorySlug)) {
      categorizedHeuristics.set(categorySlug, [])
    }
    categorizedHeuristics.get(categorySlug)!.push(heuristic)
  }

  // Convert category slugs to display names
  const categoryNames: Record<string, string> = {
    "keyboard-interaction": "Keyboard Interaction",
    "meaningful-content": "Meaningful Content",
    "page-structure": "Page Structure",
    "quality-of-life": "Quality of Life",
    readability: "Readability",
    "screen-reader-support": "Screen Reader Support",
  }

  // Add each category section
  for (const [categorySlug, categoryHeuristics] of categorizedHeuristics) {
    const categoryName = categoryNames[categorySlug] || categorySlug
    markdown += `## ${categoryName}\n\n`

    // Add each heuristic as a checklist item
    for (const heuristic of categoryHeuristics) {
      const heuristicUrl = `${url}/docs${heuristic.slug}`
      markdown += `- [ ] **${heuristic.title}** - [View Guide](${heuristicUrl})\n`
    }

    markdown += "\n"
  }

  return markdown
}

/**
 * Generates a PDF checklist from analysis results.
 *
 * Creates a printable PDF document with:
 * - Title and metadata (generation timestamp, component summary, confidence)
 * - Detected UI elements
 * - Heuristics grouped by category
 * - Checkboxes (☐) for each heuristic
 * - Clickable links to full heuristic guides
 * - Proper page breaks and formatting for printing
 *
 * Uses jsPDF to create a professional-looking PDF document that can be
 * downloaded and printed for offline reference or team sharing.
 *
 * @param result - The analysis result containing detected components and matched heuristics
 * @returns Promise resolving to PDF Blob ready for download
 *
 * @example
 * ```typescript
 * const pdfBlob = await generatePDFChecklist(analysisResult)
 * saveAs(pdfBlob, 'a11y-checklist-2026-01-28.pdf')
 * ```
 */
export async function generatePDFChecklist(
  result: AnalysisResult
): Promise<Blob> {
  const { detected, heuristics } = result

  // Create new PDF document (A4 size, portrait orientation)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let currentY = margin

  // Helper function to check if we need a new page and add text
  const addText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" = "normal",
    color: [number, number, number] = [0, 0, 0]
  ) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", fontStyle)
    doc.setTextColor(color[0], color[1], color[2])

    const lines = doc.splitTextToSize(text, contentWidth)
    const lineHeight = fontSize * 0.5

    // Check if we need a new page
    if (currentY + lines.length * lineHeight > pageHeight - margin) {
      doc.addPage()
      currentY = margin
    }

    doc.text(lines, margin, currentY)
    currentY += lines.length * lineHeight + 3
  }

  // Helper function to add a checkbox item with optional link
  const addCheckboxItem = (text: string, link?: string) => {
    const checkboxSize = 4
    const checkboxPadding = 2
    const fontSize = 11
    const lineHeight = fontSize * 0.5

    // Check if we need a new page
    if (currentY + lineHeight + 5 > pageHeight - margin) {
      doc.addPage()
      currentY = margin
    }

    // Draw checkbox (☐)
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.rect(margin, currentY - checkboxSize + 1, checkboxSize, checkboxSize)

    // Add text next to checkbox
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)

    const textX = margin + checkboxSize + checkboxPadding + 2
    const textLines = doc.splitTextToSize(
      text,
      contentWidth - checkboxSize - checkboxPadding - 2
    )

    doc.text(textLines, textX, currentY)

    // Add clickable link indicator if provided
    if (link) {
      const textWidth = doc.getTextWidth(textLines[0])
      doc.setTextColor(0, 102, 204) // Blue color for link
      doc.textWithLink(" →", textX + textWidth + 2, currentY, {
        url: link,
      })
    }

    currentY += textLines.length * lineHeight + 4
  }

  // Format timestamp
  const today = new Date()
  const timestamp = today.toLocaleDateString()

  // Title
  addText("Accessibility Heuristics Checklist", 20, "bold")
  currentY += 2

  // Date
  addText(`Generated on ${timestamp}`, 10, "normal", [100, 100, 100])
  currentY += 5

  // Analysis Summary
  addText("Analysis Summary", 14, "bold")
  addText(detected.summary, 11, "normal")

  // Confidence score (if available)
  if (detected.confidence !== undefined) {
    addText(
      `Confidence: ${Math.round(detected.confidence * 100)}%`,
      10,
      "normal",
      [100, 100, 100]
    )
  }

  // Detected Elements
  if (detected.elements.length > 0) {
    addText("Detected Elements:", 11, "bold")
    const elementsText = detected.elements
      .map((el) => el.replace(/-/g, " "))
      .join(", ")
    addText(elementsText, 10, "normal", [60, 60, 60])
  }

  currentY += 5

  // Separator line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 8

  // Group heuristics by category
  const categorizedHeuristics = new Map<string, typeof heuristics>()

  for (const heuristic of heuristics) {
    const categorySlug = heuristic.category
    if (!categorizedHeuristics.has(categorySlug)) {
      categorizedHeuristics.set(categorySlug, [])
    }
    categorizedHeuristics.get(categorySlug)!.push(heuristic)
  }

  // Convert category slugs to display names
  const categoryNames: Record<string, string> = {
    "keyboard-interaction": "Keyboard Interaction",
    "meaningful-content": "Meaningful Content",
    "page-structure": "Page Structure",
    "quality-of-life": "Quality of Life",
    readability: "Readability",
    "screen-reader-support": "Screen Reader Support",
  }

  // Add each category section with checklist items
  for (const [categorySlug, categoryHeuristics] of categorizedHeuristics) {
    const categoryName = categoryNames[categorySlug] || categorySlug

    addText(categoryName, 14, "bold")
    currentY += 2

    // Add each heuristic as a checkbox item
    for (const heuristic of categoryHeuristics) {
      const heuristicUrl = `${url}/docs${heuristic.slug}`
      addCheckboxItem(heuristic.title, heuristicUrl)
    }

    currentY += 3
  }

  // Footer
  if (currentY > pageHeight - margin - 20) {
    doc.addPage()
    currentY = pageHeight - margin - 10
  } else {
    currentY = pageHeight - margin - 10
  }

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(150, 150, 150)
  doc.textWithLink(
    "Generated with Accessibility Heuristics Guide",
    margin,
    currentY,
    { url: `${url}/analyzer` }
  )

  // Convert to Blob
  const pdfBlob = doc.output("blob")
  return pdfBlob
}
