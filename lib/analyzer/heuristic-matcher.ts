/**
 * Heuristic Matcher
 *
 * This module maps UI component elements to relevant accessibility heuristics.
 * It serves as the core matching engine that connects detected UI elements
 * with the appropriate accessibility guidelines.
 *
 * Key responsibilities:
 * - Map component elements to heuristic slugs using element-mapping
 * - Fetch full MDX content and metadata for each matched heuristic
 * - Extract preview text from the "What this means" section
 * - Deduplicate heuristics (same heuristic may match multiple elements)
 * - Sort results by category order as defined in Documents settings
 *
 * Matching Algorithm:
 * 1. Input: Array of component elements (e.g., ['text-input', 'button'])
 * 2. Lookup: Use element-mapping to get relevant heuristic slugs
 * 3. Fetch: Load full MDX content and frontmatter for each heuristic
 * 4. Transform: Extract metadata (title, owner, keywords, category, preview)
 * 5. Deduplicate: Remove duplicate heuristics (by slug)
 * 6. Sort: Order by category as defined in Documents settings
 * 7. Output: Array of HeuristicMatch objects with complete metadata
 *
 * Data Flow:
 * ComponentElement[] → element-mapping → heuristic slugs → getDocument() →
 * MDX content + frontmatter → HeuristicMatch[] → dedupe + sort → final results
 */

import { promises as fs } from "fs"
import path from "path"

import { Documents } from "@/settings/documents"
import { GitHubLink } from "@/settings/navigation"

import { Settings } from "@/types/settings"
import { getHeuristicsForElements } from "@/lib/analyzer/element-mapping"
import { getDocument } from "@/lib/markdown"
import type { ComponentElement, HeuristicMatch } from "@/lib/types/analyzer"

/**
 * Maps UI component elements to relevant accessibility heuristics with full metadata.
 *
 * This function takes an array of component element types (button, text-input, etc.)
 * and returns a deduplicated, categorized list of heuristics that apply to those elements.
 *
 * The function:
 * 1. Retrieves heuristic slugs for the given elements using the element-to-heuristic mapping
 * 2. Fetches full MDX content for each heuristic
 * 3. Extracts metadata (title, owner, keywords, category, preview)
 * 4. Removes duplicates
 * 5. Groups and sorts by category order as defined in Documents settings
 *
 * @param elements - Array of component element types to analyze (e.g., ['text-input', 'button'])
 * @returns Promise resolving to array of HeuristicMatch objects with full metadata
 *
 * @example
 * ```typescript
 * const elements: ComponentElement[] = ['text-input', 'button']
 * const matches = await matchHeuristics(elements)
 * // Returns: [
 * //   {
 * //     slug: '/keyboard-interaction/visible-focus',
 * //     category: 'keyboard-interaction',
 * //     title: 'Is the focus indicator clearly visible...',
 * //     owner: ['designer', 'developer'],
 * //     keywords: ['focus indicator', 'focus visible', ...],
 * //     preview: 'When someone navigates an interface using a keyboard...'
 * //   },
 * //   ...
 * // ]
 * ```
 */
export async function matchHeuristics(
  elements: ComponentElement[]
): Promise<HeuristicMatch[]> {
  // Step 1: Get unique heuristic slugs for the given elements
  // This uses the element-mapping to find all relevant heuristics
  // Input: ['text-input', 'button'] → Output: ['/keyboard-interaction/visible-focus', ...]
  const heuristicSlugs = getHeuristicsForElements(elements)

  // Step 2: Fetch full heuristic data for each slug in parallel
  // Using Promise.all for performance - all MDX files are fetched concurrently
  const heuristicPromises = heuristicSlugs.map(async (slug) => {
    try {
      // Convert slug format for getDocument function
      // getDocument expects "category/heuristic" without leading slash
      // e.g., "/keyboard-interaction/visible-focus" -> "keyboard-interaction/visible-focus"
      const documentSlug = slug.startsWith("/") ? slug.slice(1) : slug

      // Fetch MDX content and frontmatter
      const document = await getDocument(documentSlug)

      if (!document) {
        console.warn(`Failed to load heuristic: ${slug}`)
        return null
      }

      // Extract category from slug (first path segment)
      // This is used for grouping and sorting results
      // e.g., "/keyboard-interaction/visible-focus" -> "keyboard-interaction"
      const category = slug.split("/").filter(Boolean)[0]

      // Extract preview text from the "What this means" section
      // This provides context in the UI without loading full content
      const preview = await extractPreviewText(documentSlug)

      // Build complete HeuristicMatch object with all metadata
      const heuristicMatch: HeuristicMatch = {
        slug,
        category,
        title: document.frontmatter.title,
        owner: document.frontmatter.owner || [],
        keywords: parseKeywords(document.frontmatter.keywords),
        preview,
      }

      return heuristicMatch
    } catch (error) {
      console.error(`Error processing heuristic ${slug}:`, error)
      return null
    }
  })

  // Step 3: Wait for all parallel fetches to complete
  const heuristicResults = await Promise.all(heuristicPromises)

  // Step 4: Filter out failed loads (null results)
  // Some heuristics may fail to load due to missing files or parse errors
  const validHeuristics = heuristicResults.filter(
    (h): h is HeuristicMatch => h !== null
  )

  // Step 5: Remove duplicates by slug
  // The same heuristic may be relevant to multiple elements
  // e.g., "visible-focus" applies to text-input, button, link, etc.
  // Using Map ensures we keep only one instance per unique slug
  const uniqueHeuristics = Array.from(
    new Map(validHeuristics.map((h) => [h.slug, h])).values()
  )

  // Step 6: Get category order from Documents settings
  // This defines the canonical order for displaying categories
  // e.g., ["keyboard-interaction", "meaningful-content", "page-structure", ...]
  const categoryOrder = Documents.filter(
    (doc): doc is Extract<typeof doc, { href: string }> =>
      "href" in doc && typeof doc.href === "string"
  ).map((doc) => doc.href.slice(1)) // Remove leading "/" from hrefs

  // Step 7: Sort heuristics by category order
  // This ensures results are presented in a logical, consistent order
  // matching the main documentation structure
  uniqueHeuristics.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.category)
    const bIndex = categoryOrder.indexOf(b.category)

    // If both categories found in order list, sort by their defined order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // If only one category found, prioritize it (shouldn't happen in practice)
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    // If neither found, maintain original order (shouldn't happen)
    return 0
  })

  return uniqueHeuristics
}

/**
 * Extracts preview text from the "What this means" section of a heuristic document.
 *
 * This function reads the raw MDX file and extracts the first ~150 characters
 * from the content that follows the "## What this means" heading.
 *
 * @param slug - The document slug (e.g., "keyboard-interaction/visible-focus")
 * @returns Promise resolving to preview text (up to ~150 characters)
 */
async function extractPreviewText(slug: string): Promise<string> {
  try {
    let rawMdx = ""

    // Read raw MDX content based on deployment mode
    // Settings.gitload determines if we fetch from GitHub or local filesystem
    if (Settings.gitload) {
      // Production mode: fetch from GitHub repository
      const contentPath = `${GitHubLink.href}/raw/main/contents/heuristics/${slug}/index.mdx`
      const response = await fetch(contentPath)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch content from GitHub: ${response.statusText}`
        )
      }
      rawMdx = await response.text()
    } else {
      // Development mode: read from local filesystem
      const contentPath = path.join(
        process.cwd(),
        "/contents/heuristics/",
        `${slug}/index.mdx`
      )
      rawMdx = await fs.readFile(contentPath, "utf-8")
    }

    // Find the "## What this means" section using regex
    // This section contains the user-friendly explanation of the heuristic
    // Capture everything between "## What this means" and the next heading (or EOF)
    const whatThisMeansRegex =
      /##\s+What this means\s*\n\n([\s\S]*?)(?=\n##|$)/i
    const match = rawMdx.match(whatThisMeansRegex)

    if (!match || !match[1]) {
      // Fallback: return empty string if section not found
      // This is graceful degradation - results still work without preview
      return ""
    }

    // Extract first paragraph only (most relevant summary)
    // Split by double newline to isolate paragraphs
    const content = match[1]
      .trim()
      .split("\n\n")[0] // Get first paragraph
      .replace(/\n/g, " ") // Replace newlines with spaces for clean display
      .trim()

    // Truncate to ~150 characters at word boundary
    // This length provides context without overwhelming the UI
    if (content.length <= 150) {
      return content
    }

    // Find last space before 150 characters to avoid cutting words
    const truncated = content.slice(0, 150)
    const lastSpace = truncated.lastIndexOf(" ")

    // Truncate at word boundary and add ellipsis
    return lastSpace > 0
      ? truncated.slice(0, lastSpace) + "..."
      : truncated + "..."
  } catch (error) {
    console.error(`Error extracting preview text for ${slug}:`, error)
    // Graceful degradation: return empty string on error
    return ""
  }
}

/**
 * Parses keywords from frontmatter, which can be a string or array.
 *
 * MDX frontmatter can represent keywords in different formats:
 * - Array: keywords: ["focus", "keyboard", "navigation"]
 * - String: keywords: "focus, keyboard, navigation"
 *
 * This function normalizes both formats into a consistent array output.
 *
 * @param keywords - Keywords from frontmatter (string or array)
 * @returns Array of keyword strings
 */
function parseKeywords(keywords: unknown): string[] {
  if (Array.isArray(keywords)) {
    // Already in array format - return as-is
    return keywords as string[]
  }

  if (typeof keywords === "string") {
    // Handle comma-separated string format
    // Split by comma and trim whitespace from each keyword
    return keywords.split(",").map((k) => k.trim())
  }

  // Fallback: return empty array if keywords field is missing or invalid
  return []
}
