// app/api/analyzer/route.ts

import { NextRequest, NextResponse } from "next/server"

import {
  analyzeComponentDescription,
  analyzeComponentImage,
  isOpenAIConfigured,
} from "@/lib/analyzer/openai-client"
import type { ComponentElement } from "@/lib/types/analyzer"

/**
 * POST /api/analyzer
 *
 * Analyzes a component using either an uploaded image or a text description.
 * Returns detected UI elements with a summary and confidence score.
 *
 * Request formats:
 * 1. Image upload (multipart/form-data):
 *    - Field name: 'image'
 *    - Content-Type: image/png, image/jpeg, image/webp, etc.
 *
 * 2. Text description (application/json):
 *    - Body: { "description": "Login form with email field and submit button" }
 *
 * Response format:
 * {
 *   "detected": {
 *     "summary": "Login form with 2 text inputs, 1 button, 1 link",
 *     "elements": ["text-input", "button", "link"],
 *     "confidence": 0.95
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid request (missing data, wrong content type)
 * - 401: OpenAI API key not configured
 * - 500: OpenAI API error or internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.",
        },
        { status: 401 }
      )
    }

    // TODO: Implement rate limiting to prevent abuse
    // Consider using libraries like 'upstash/ratelimit' or 'next-rate-limit'
    // Example rate limit: 10 requests per minute per IP address

    const contentType = request.headers.get("content-type") || ""

    let elements: ComponentElement[] = []
    let inputType: "image" | "description" = "description"

    // Handle image upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const image = formData.get("image")

      if (!image || !(image instanceof File)) {
        return NextResponse.json(
          {
            error:
              "Missing or invalid 'image' field in form data. Please provide a valid image file.",
          },
          { status: 400 }
        )
      }

      // Validate image file type
      const validImageTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/gif",
      ]
      if (!validImageTypes.includes(image.type)) {
        return NextResponse.json(
          {
            error: `Invalid image type: ${image.type}. Supported types: PNG, JPEG, WebP, GIF.`,
          },
          { status: 400 }
        )
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (image.size > maxSize) {
        return NextResponse.json(
          {
            error: `Image file too large: ${Math.round(image.size / 1024 / 1024)}MB. Maximum size: 10MB.`,
          },
          { status: 400 }
        )
      }

      inputType = "image"
      console.log(
        `[API] Analyzing image: ${image.name} (${image.type}, ${image.size} bytes)`
      )

      try {
        elements = await analyzeComponentImage(image)
      } catch (error) {
        console.error("[API] Error analyzing image:", error)

        const errorMessage =
          error instanceof Error ? error.message : "Failed to analyze image"

        // Check if it's an OpenAI API error
        if (errorMessage.includes("OpenAI API error")) {
          return NextResponse.json(
            { error: `Failed to analyze image: ${errorMessage}` },
            { status: 500 }
          )
        }

        return NextResponse.json(
          { error: `Failed to analyze image: ${errorMessage}` },
          { status: 500 }
        )
      }
    }
    // Handle text description (application/json)
    else if (contentType.includes("application/json")) {
      let body: { description?: string }

      try {
        body = await request.json()
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid JSON in request body." },
          { status: 400 }
        )
      }

      const { description } = body

      if (
        !description ||
        typeof description !== "string" ||
        description.trim().length === 0
      ) {
        return NextResponse.json(
          {
            error:
              "Missing or invalid 'description' field. Please provide a non-empty text description.",
          },
          { status: 400 }
        )
      }

      // Validate description length (max 2000 characters)
      if (description.length > 2000) {
        return NextResponse.json(
          {
            error: `Description too long: ${description.length} characters. Maximum length: 2000 characters.`,
          },
          { status: 400 }
        )
      }

      inputType = "description"
      console.log(
        `[API] Analyzing description: "${description.slice(0, 100)}..."`
      )

      try {
        elements = await analyzeComponentDescription(description)
      } catch (error) {
        console.error("[API] Error analyzing description:", error)

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to analyze description"

        // Check if it's an OpenAI API error
        if (errorMessage.includes("OpenAI API error")) {
          return NextResponse.json(
            { error: `Failed to analyze description: ${errorMessage}` },
            { status: 500 }
          )
        }

        return NextResponse.json(
          { error: `Failed to analyze description: ${errorMessage}` },
          { status: 500 }
        )
      }
    }
    // Unsupported content type
    else {
      return NextResponse.json(
        {
          error:
            "Unsupported Content-Type. Use 'multipart/form-data' for image upload or 'application/json' for text description.",
        },
        { status: 400 }
      )
    }

    // Generate summary based on detected elements
    const summary = generateSummary(elements, inputType)

    // Calculate confidence score based on number of elements detected
    // More elements typically means higher confidence in the analysis
    const confidence = calculateConfidence(elements)

    // Return successful response
    return NextResponse.json({
      detected: {
        summary,
        elements,
        confidence,
      },
    })
  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error("[API] Unexpected error in analyzer route:", error)

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred"

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

/**
 * Generates a human-readable summary of detected elements
 */
function generateSummary(
  elements: ComponentElement[],
  inputType: "image" | "description"
): string {
  if (elements.length === 0) {
    return inputType === "image"
      ? "No UI elements detected in the image"
      : "No UI elements detected in the description"
  }

  // Count element types
  const elementCounts = new Map<string, number>()
  elements.forEach((element) => {
    elementCounts.set(element, (elementCounts.get(element) || 0) + 1)
  })

  // Format element counts into readable text
  const parts: string[] = []
  elementCounts.forEach((count, element) => {
    const elementName = element.replace(/-/g, " ")
    const plural = count > 1 ? "s" : ""
    parts.push(`${count} ${elementName}${plural}`)
  })

  // Create summary
  const componentType =
    inputType === "image" ? "Component" : "Component description"

  if (parts.length === 1) {
    return `${componentType} with ${parts[0]}`
  } else if (parts.length === 2) {
    return `${componentType} with ${parts[0]} and ${parts[1]}`
  } else {
    const lastPart = parts.pop()
    return `${componentType} with ${parts.join(", ")}, and ${lastPart}`
  }
}

/**
 * Calculates confidence score based on detected elements
 *
 * Confidence scoring rules:
 * - 0 elements: 0.0 (no detection)
 * - 1 element: 0.7 (moderate confidence)
 * - 2-3 elements: 0.85 (high confidence)
 * - 4+ elements: 0.95 (very high confidence)
 */
function calculateConfidence(elements: ComponentElement[]): number {
  if (elements.length === 0) return 0.0
  if (elements.length === 1) return 0.7
  if (elements.length <= 3) return 0.85
  return 0.95
}
