/**
 * Export Generator
 *
 * This module generates downloadable checklists from analyzer results.
 * It supports two export formats: Markdown and PDF.
 *
 * Key responsibilities:
 * - Generate Markdown checklists with GitHub-flavored formatting
 * - Generate PDF checklists with professional layout and styling
 * - Group heuristics by category in both formats
 * - Include metadata (timestamp, component summary, links)
 * - Handle pagination and page breaks for PDF
 *
 * Export Format Decisions:
 *
 * Markdown:
 * - Uses GitHub-flavored Markdown with task list checkboxes (- [ ])
 * - Includes clickable links to full heuristic guides
 * - Plain text format for maximum compatibility and editability
 * - Can be used in GitHub issues, project management tools, or documentation
 *
 * PDF:
 * - Professional A4 portrait layout optimized for printing
 * - Uses Helvetica font (universally available, clean, readable)
 * - Includes checkboxes (☐) for offline tracking
 * - Clickable hyperlinks to full guides (for digital use)
 * - Automatic page breaks to avoid splitting content
 * - 20mm margins for comfortable reading and printing
 *
 * Filename Format:
 * - Markdown: accessibility-checklist-YYYY-MM-DD.md
 * - PDF: accessibility-checklist-YYYY-MM-DD.pdf
 * - Date format ensures chronological sorting and version tracking
 */

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

  // Format timestamp as YYYY-MM-DD for consistent date display
  // ISO format ensures unambiguous date representation
  const today = new Date()
  const timestamp = today.toISOString().split("T")[0]

  // Build Markdown document with clear structure
  let markdown = "# Accessibility Heuristics Checklist\n\n"
  markdown += `Generated: ${timestamp}\n`
  markdown += `Component: ${detected.summary}\n\n`

  // Group heuristics by category for organized display
  // Using Map preserves insertion order (important for consistent output)
  const categorizedHeuristics = new Map<string, typeof heuristics>()

  for (const heuristic of heuristics) {
    const categorySlug = heuristic.category
    if (!categorizedHeuristics.has(categorySlug)) {
      categorizedHeuristics.set(categorySlug, [])
    }
    categorizedHeuristics.get(categorySlug)!.push(heuristic)
  }

  // Convert category slugs to human-readable display names
  // This mapping maintains consistency with the main site navigation
  const categoryNames: Record<string, string> = {
    "keyboard-interaction": "Keyboard Interaction",
    "meaningful-content": "Meaningful Content",
    "page-structure": "Page Structure",
    "quality-of-life": "Quality of Life",
    readability: "Readability",
    "screen-reader-support": "Screen Reader Support",
  }

  // Add each category section with its heuristics
  for (const [categorySlug, categoryHeuristics] of categorizedHeuristics) {
    const categoryName = categoryNames[categorySlug] || categorySlug
    markdown += `## ${categoryName}\n\n`

    // Add each heuristic as a GitHub-flavored Markdown task list item
    // Format: - [ ] **Title** - [View Guide](url)
    // The checkbox syntax (- [ ]) is recognized by GitHub, GitLab, and many markdown renderers
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

  // Create new PDF document with standard A4 portrait format
  // A4 (210mm × 297mm) is the international standard for documents
  // Portrait orientation is optimal for checklist readability
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Calculate page dimensions and margins
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  // 20mm margins provide comfortable reading and printing margins
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  // Track vertical position for content placement
  let currentY = margin

  /**
   * Helper function to add text with automatic pagination.
   *
   * Handles:
   * - Text wrapping to fit within page width
   * - Automatic page breaks when content exceeds page height
   * - Font styling and color customization
   * - Vertical spacing after text
   *
   * @param text - Text content to add
   * @param fontSize - Font size in points
   * @param fontStyle - Font weight (normal or bold)
   * @param color - RGB color array [r, g, b] where values are 0-255
   */
  const addText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" = "normal",
    color: [number, number, number] = [0, 0, 0]
  ) => {
    doc.setFontSize(fontSize)
    // Helvetica is used for universal compatibility and clean readability
    doc.setFont("helvetica", fontStyle)
    doc.setTextColor(color[0], color[1], color[2])

    // Split text into lines that fit within content width
    // This handles text wrapping automatically
    const lines = doc.splitTextToSize(text, contentWidth)
    // Line height is proportional to font size (0.5 factor provides comfortable spacing)
    const lineHeight = fontSize * 0.5

    // Check if content fits on current page, add new page if needed
    // This prevents text from being cut off at page boundaries
    if (currentY + lines.length * lineHeight > pageHeight - margin) {
      doc.addPage()
      currentY = margin
    }

    doc.text(lines, margin, currentY)
    // Advance vertical position: line height × number of lines + 3mm spacing
    currentY += lines.length * lineHeight + 3
  }

  /**
   * Helper function to add a checkbox item with optional hyperlink.
   *
   * Creates a checklist item with:
   * - A 4mm checkbox square for manual checking
   * - Wrapped text label
   * - Optional clickable arrow link (→) to full guide
   *
   * Design decisions:
   * - 4mm checkbox is large enough to check by hand when printed
   * - 2mm padding between checkbox and text prevents crowding
   * - Text wraps if longer than available width
   * - Arrow indicator (→) shows clickable links without cluttering layout
   * - Blue color (#0066CC) for links follows web convention
   *
   * @param text - Heuristic title text
   * @param link - Optional URL to full heuristic guide
   */
  const addCheckboxItem = (text: string, link?: string) => {
    const checkboxSize = 4 // 4mm square - printable size
    const checkboxPadding = 2 // 2mm breathing room
    const fontSize = 11 // 11pt for readable body text
    const lineHeight = fontSize * 0.5

    // Check if item fits on current page
    if (currentY + lineHeight + 5 > pageHeight - margin) {
      doc.addPage()
      currentY = margin
    }

    // Draw checkbox square using jsPDF rectangle function
    doc.setDrawColor(100, 100, 100) // Medium gray for subtle outline
    doc.setLineWidth(0.3) // Thin line for clean appearance
    doc.rect(margin, currentY - checkboxSize + 1, checkboxSize, checkboxSize)

    // Add text next to checkbox
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0) // Black text for maximum readability

    // Calculate text position accounting for checkbox and padding
    const textX = margin + checkboxSize + checkboxPadding + 2
    const textLines = doc.splitTextToSize(
      text,
      contentWidth - checkboxSize - checkboxPadding - 2
    )

    doc.text(textLines, textX, currentY)

    // Add clickable link indicator if provided
    // The arrow (→) is a visual cue that the item is clickable
    if (link) {
      const textWidth = doc.getTextWidth(textLines[0])
      doc.setTextColor(0, 102, 204) // Blue color (#0066CC) signals clickable link
      doc.textWithLink(" →", textX + textWidth + 2, currentY, {
        url: link,
      })
    }

    // Advance vertical position for next item
    currentY += textLines.length * lineHeight + 4
  }

  // Format timestamp for header
  const today = new Date()
  const timestamp = today.toLocaleDateString()

  // Document title - 20pt bold for clear hierarchy
  addText("Accessibility Heuristics Checklist", 20, "bold")
  currentY += 2

  // Generation date in smaller gray text
  addText(`Generated on ${timestamp}`, 10, "normal", [100, 100, 100])
  currentY += 5

  // Analysis Summary section
  addText("Analysis Summary", 14, "bold")
  addText(detected.summary, 11, "normal")

  // Confidence score (if available from AI analysis)
  // Currently not provided by element picker, but included for future enhancement
  if (detected.confidence !== undefined) {
    addText(
      `Confidence: ${Math.round(detected.confidence * 100)}%`,
      10,
      "normal",
      [100, 100, 100]
    )
  }

  // List detected UI elements
  if (detected.elements.length > 0) {
    addText("Detected Elements:", 11, "bold")
    // Convert kebab-case to human-readable format
    // e.g., "text-input" → "text input"
    const elementsText = detected.elements
      .map((el) => el.replace(/-/g, " "))
      .join(", ")
    addText(elementsText, 10, "normal", [60, 60, 60])
  }

  currentY += 5

  // Separator line between header and content
  // Light gray line provides visual separation without being distracting
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 8

  // Group heuristics by category for organized presentation
  // Using Map preserves insertion order (categories are already sorted by matchHeuristics)
  const categorizedHeuristics = new Map<string, typeof heuristics>()

  for (const heuristic of heuristics) {
    const categorySlug = heuristic.category
    if (!categorizedHeuristics.has(categorySlug)) {
      categorizedHeuristics.set(categorySlug, [])
    }
    categorizedHeuristics.get(categorySlug)!.push(heuristic)
  }

  // Convert category slugs to human-readable display names
  // This mapping must match the site's category structure for consistency
  const categoryNames: Record<string, string> = {
    "keyboard-interaction": "Keyboard Interaction",
    "meaningful-content": "Meaningful Content",
    "page-structure": "Page Structure",
    "quality-of-life": "Quality of Life",
    readability: "Readability",
    "screen-reader-support": "Screen Reader Support",
  }

  // Add each category section with its heuristics
  for (const [categorySlug, categoryHeuristics] of categorizedHeuristics) {
    const categoryName = categoryNames[categorySlug] || categorySlug

    // Category heading - 14pt bold for clear section delineation
    addText(categoryName, 14, "bold")
    currentY += 2

    // Add each heuristic as a checkbox item with clickable link
    for (const heuristic of categoryHeuristics) {
      const heuristicUrl = `${url}/docs${heuristic.slug}`
      addCheckboxItem(heuristic.title, heuristicUrl)
    }

    // Add spacing between category sections
    currentY += 3
  }

  // Add footer with attribution and link to analyzer
  // If content filled the page, add a new page for the footer
  if (currentY > pageHeight - margin - 20) {
    doc.addPage()
    currentY = pageHeight - margin - 10
  } else {
    // Otherwise, position footer at bottom of current page
    currentY = pageHeight - margin - 10
  }

  // Small gray text for unobtrusive footer
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(150, 150, 150) // Light gray
  // Add clickable link to analyzer tool for reference
  doc.textWithLink(
    "Generated with Accessibility Heuristics Guide",
    margin,
    currentY,
    { url: `${url}/analyzer` }
  )

  // Convert jsPDF document to Blob for download
  // Blob format allows the file to be saved via browser download APIs
  const pdfBlob = doc.output("blob")
  return pdfBlob
}
