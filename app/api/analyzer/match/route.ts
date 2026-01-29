// app/api/analyzer/match/route.ts

import { NextRequest, NextResponse } from "next/server"

import { matchHeuristics } from "@/lib/analyzer/heuristic-matcher"
import type { ComponentElement } from "@/lib/types/analyzer"

/**
 * POST /api/analyzer/match
 *
 * Matches UI component elements to relevant accessibility heuristics.
 * This endpoint is used when the user selects elements via the element picker.
 *
 * Request format (application/json):
 * {
 *   "elements": ["text-input", "button", "label"]
 * }
 *
 * Response format:
 * {
 *   "heuristics": [
 *     {
 *       "slug": "/keyboard-interaction/visible-focus",
 *       "category": "keyboard-interaction",
 *       "title": "Is the focus indicator clearly visible...",
 *       "owner": ["designer", "developer"],
 *       "keywords": ["focus indicator", "focus visible", ...],
 *       "preview": "When someone navigates an interface using a keyboard..."
 *     },
 *     ...
 *   ]
 * }
 *
 * Error responses:
 * - 400: Invalid request (missing elements, not an array, empty array)
 * - 500: Internal server error during heuristic matching
 */
export async function POST(request: NextRequest) {
  try {
    let body: { elements?: ComponentElement[] }

    // Parse JSON body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      )
    }

    const { elements } = body

    // Validate elements field
    if (!elements) {
      return NextResponse.json(
        {
          error:
            "Missing 'elements' field. Please provide an array of component elements.",
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(elements)) {
      return NextResponse.json(
        {
          error:
            "Invalid 'elements' field. Must be an array of component elements.",
        },
        { status: 400 }
      )
    }

    if (elements.length === 0) {
      return NextResponse.json(
        {
          error:
            "Empty 'elements' array. Please provide at least one component element.",
        },
        { status: 400 }
      )
    }

    console.log(`[API] Matching heuristics for elements:`, elements)

    // Match heuristics based on selected elements
    try {
      const heuristics = await matchHeuristics(elements)

      console.log(`[API] Found ${heuristics.length} matching heuristics`)

      // Return successful response
      return NextResponse.json({
        heuristics,
      })
    } catch (error) {
      console.error("[API] Error matching heuristics:", error)

      const errorMessage =
        error instanceof Error ? error.message : "Failed to match heuristics"

      return NextResponse.json(
        { error: `Failed to match heuristics: ${errorMessage}` },
        { status: 500 }
      )
    }
  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error("[API] Unexpected error in match route:", error)

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred"

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
