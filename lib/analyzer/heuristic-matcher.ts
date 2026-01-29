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
  // Get unique heuristic slugs for the given elements
  const heuristicSlugs = getHeuristicsForElements(elements)

  // Fetch heuristic data for each slug
  const heuristicPromises = heuristicSlugs.map(async (slug) => {
    try {
      // Remove leading "/" and pass to getDocument
      // e.g., "/keyboard-interaction/visible-focus" -> "keyboard-interaction/visible-focus"
      const documentSlug = slug.startsWith("/") ? slug.slice(1) : slug

      const document = await getDocument(documentSlug)

      if (!document) {
        console.warn(`Failed to load heuristic: ${slug}`)
        return null
      }

      // Extract category from slug (first part of path)
      // e.g., "/keyboard-interaction/visible-focus" -> "keyboard-interaction"
      const category = slug.split("/").filter(Boolean)[0]

      // Extract preview text from the "What this means" section
      const preview = await extractPreviewText(documentSlug)

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

  // Wait for all heuristics to be fetched
  const heuristicResults = await Promise.all(heuristicPromises)

  // Filter out failed loads
  const validHeuristics = heuristicResults.filter(
    (h): h is HeuristicMatch => h !== null
  )

  // Remove duplicates by slug
  const uniqueHeuristics = Array.from(
    new Map(validHeuristics.map((h) => [h.slug, h])).values()
  )

  // Get category order from Documents settings
  const categoryOrder = Documents.filter(
    (doc): doc is Extract<typeof doc, { href: string }> =>
      "href" in doc && typeof doc.href === "string"
  ).map((doc) => doc.href.slice(1)) // Remove leading "/"

  // Sort by category order
  uniqueHeuristics.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.category)
    const bIndex = categoryOrder.indexOf(b.category)

    // If both categories found, sort by their order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // If only one category found, put it first
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1

    // If neither found, maintain original order
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

    // Read raw MDX content
    if (Settings.gitload) {
      const contentPath = `${GitHubLink.href}/raw/main/contents/heuristics/${slug}/index.mdx`
      const response = await fetch(contentPath)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch content from GitHub: ${response.statusText}`
        )
      }
      rawMdx = await response.text()
    } else {
      const contentPath = path.join(
        process.cwd(),
        "/contents/heuristics/",
        `${slug}/index.mdx`
      )
      rawMdx = await fs.readFile(contentPath, "utf-8")
    }

    // Find the "## What this means" section
    const whatThisMeansRegex =
      /##\s+What this means\s*\n\n([\s\S]*?)(?=\n##|$)/i
    const match = rawMdx.match(whatThisMeansRegex)

    if (!match || !match[1]) {
      // Fallback: return empty string
      return ""
    }

    // Extract first paragraph (up to 150 characters)
    const content = match[1]
      .trim()
      .split("\n\n")[0] // Get first paragraph
      .replace(/\n/g, " ") // Replace newlines with spaces
      .trim()

    // Truncate to ~150 characters at word boundary
    if (content.length <= 150) {
      return content
    }

    const truncated = content.slice(0, 150)
    const lastSpace = truncated.lastIndexOf(" ")

    return lastSpace > 0
      ? truncated.slice(0, lastSpace) + "..."
      : truncated + "..."
  } catch (error) {
    console.error(`Error extracting preview text for ${slug}:`, error)
    return ""
  }
}

/**
 * Parses keywords from frontmatter, which can be a string or array.
 *
 * @param keywords - Keywords from frontmatter (string or array)
 * @returns Array of keyword strings
 */
function parseKeywords(keywords: unknown): string[] {
  if (Array.isArray(keywords)) {
    return keywords as string[]
  }

  if (typeof keywords === "string") {
    // Handle comma-separated string
    return keywords.split(",").map((k) => k.trim())
  }

  return []
}
