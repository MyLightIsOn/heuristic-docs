/**
 * OpenAI Client for Component Analysis
 *
 * This module provides AI-powered analysis of UI components using OpenAI's GPT-4 models.
 * It supports two input methods:
 * - Image analysis using GPT-4 Vision (gpt-4o with vision capabilities)
 * - Text description analysis using GPT-4
 *
 * Key responsibilities:
 * - Initialize and manage OpenAI client instance
 * - Analyze component images to detect UI elements
 * - Analyze text descriptions to detect UI elements
 * - Validate API configuration and availability
 * - Handle various response formats from OpenAI API
 * - Filter and deduplicate detected elements
 *
 * Model Selection Rationale:
 * - Uses "gpt-4o" for both image and text analysis
 * - GPT-4o supports vision capabilities for image analysis
 * - Temperature set to 0.3 for consistent, deterministic results
 * - JSON mode ensures structured responses for reliable parsing
 *
 * Response Format:
 * - Uses structured JSON output with response_format: { type: "json_object" }
 * - Expects {"elements": ["element1", "element2", ...]} structure
 * - Handles various response formats for robustness (elements, componentElements, or any array)
 */

import OpenAI from "openai"

import type { ComponentElement } from "@/lib/types/analyzer"

/**
 * Lazily initialize OpenAI client with API key from environment variables.
 * This prevents instantiation during build time when the API key may not be available.
 *
 * Lazy initialization is critical because:
 * - Next.js builds pages at compile time
 * - Environment variables may not be available during build
 * - Client is only created when actually needed (runtime)
 */
let openaiInstance: OpenAI | null = null

/**
 * Gets or creates the OpenAI client instance.
 * Uses singleton pattern to reuse the same client across multiple API calls.
 *
 * @returns Configured OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

/**
 * List of all valid component elements that can be detected.
 *
 * This whitelist serves multiple purposes:
 * - Constrains AI output to known element types
 * - Ensures consistency with element-to-heuristic mappings
 * - Filters out hallucinated or invalid element types
 * - Provides clear expectations in the system prompt
 *
 * Element categories:
 * - Form controls: text-input, checkbox, radio, textarea, select, file-upload, toggle
 * - Interactive: button, link, dropdown, menu, modal, tabs, accordion
 * - Content: heading, paragraph, list, table, icon, image, video, audio
 */
const VALID_ELEMENTS: ComponentElement[] = [
  "text-input",
  "checkbox",
  "radio",
  "textarea",
  "select",
  "file-upload",
  "toggle",
  "button",
  "link",
  "dropdown",
  "menu",
  "modal",
  "tabs",
  "accordion",
  "heading",
  "paragraph",
  "list",
  "table",
  "icon",
  "image",
  "video",
  "audio",
]

/**
 * Analyzes an uploaded component image using GPT-4 Vision to detect UI elements
 *
 * @param image - The uploaded image file to analyze
 * @returns Promise resolving to an array of detected component elements
 * @throws Error if the API call fails or returns invalid data
 *
 * @example
 * ```typescript
 * const elements = await analyzeComponentImage(imageFile)
 * // Returns: ['text-input', 'button', 'link']
 * ```
 */
export async function analyzeComponentImage(
  image: File
): Promise<ComponentElement[]> {
  try {
    // Convert image to base64 data URL for GPT-4 Vision API
    // OpenAI's vision API accepts base64-encoded images in data URL format
    const buffer = await image.arrayBuffer()
    const base64Image = Buffer.from(buffer).toString("base64")
    const imageUrl = `data:${image.type};base64,${base64Image}`

    console.log(`[OpenAI] Analyzing image: ${image.name} (${image.size} bytes)`)

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      // Use GPT-4o which supports vision capabilities
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          // System prompt engineering strategy:
          // - Define clear expert role for better context
          // - Provide exhaustive list of valid elements to constrain output
          // - Request structured JSON format with specific key name
          // - Give concrete example to guide response format
          content: `You are an expert UI/UX analyzer. Analyze component images and identify all UI elements present.

Valid element types: ${VALID_ELEMENTS.join(", ")}

Return ONLY a JSON object with an "elements" array containing the element types found.

Example response: {"elements": ["text-input", "button", "link"]}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyze this UI component image and list all the element types you can identify. Return a JSON object with an "elements" array.',
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                // Use "high" detail for better element detection
                // This is worth the extra tokens for accuracy
                detail: "high",
              },
            },
          ],
        },
      ],
      // Force JSON output mode for structured, parseable responses
      response_format: { type: "json_object" },
      // Low temperature (0.3) for consistent, deterministic results
      // Higher temperature would add creativity but reduce reliability
      temperature: 0.3,
      // Limit tokens since we expect concise element lists
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI API")
    }

    console.log("[OpenAI] Raw response:", content)

    // Parse the JSON response
    const parsed = JSON.parse(content)

    // Handle different possible response structures
    // GPT-4 may return various formats despite our prompt, so we check multiple possibilities
    // This defensive parsing ensures robustness across API updates and edge cases
    let elements: string[] = []
    if (Array.isArray(parsed)) {
      // Case 1: Direct array (rare but possible)
      elements = parsed
    } else if (parsed.elements && Array.isArray(parsed.elements)) {
      // Case 2: {"elements": [...]} - our expected format
      elements = parsed.elements
    } else if (
      parsed.componentElements &&
      Array.isArray(parsed.componentElements)
    ) {
      // Case 3: {"componentElements": [...]} - alternative key name
      elements = parsed.componentElements
    } else {
      // Case 4: Try to find any array in the response object
      // This catches unexpected key names while maintaining functionality
      const firstArray = Object.values(parsed).find((val) => Array.isArray(val))
      if (firstArray && Array.isArray(firstArray)) {
        elements = firstArray
      } else {
        throw new Error("Could not parse elements from response")
      }
    }

    // Validate and filter elements against our whitelist
    // This prevents hallucinated or misspelled element types from being used
    const validElements = elements.filter((el): el is ComponentElement =>
      VALID_ELEMENTS.includes(el as ComponentElement)
    )

    // Remove duplicates (GPT-4 sometimes repeats elements)
    // Using Set ensures each element appears only once
    const uniqueElements = Array.from(new Set(validElements))

    console.log(
      `[OpenAI] Detected ${uniqueElements.length} elements:`,
      uniqueElements
    )

    if (uniqueElements.length === 0) {
      console.warn("[OpenAI] No valid elements detected in image")
    }

    return uniqueElements
  } catch (error) {
    console.error("[OpenAI] Error analyzing image:", error)

    // Provide more helpful error messages for common failure cases
    if (error instanceof OpenAI.APIError) {
      // API errors include rate limits, auth issues, model availability
      throw new Error(`OpenAI API error (${error.status}): ${error.message}`)
    }

    // Re-throw with context for debugging
    throw error instanceof Error
      ? error
      : new Error("Failed to analyze component image")
  }
}

/**
 * Analyzes a text description of a component using GPT-4 to detect UI elements
 *
 * @param description - Natural language description of the component
 * @returns Promise resolving to an array of detected component elements
 * @throws Error if the API call fails or returns invalid data
 *
 * @example
 * ```typescript
 * const elements = await analyzeComponentDescription(
 *   "A login form with email and password fields, a submit button, and a forgot password link"
 * )
 * // Returns: ['text-input', 'button', 'link']
 * ```
 */
export async function analyzeComponentDescription(
  description: string
): Promise<ComponentElement[]> {
  try {
    console.log(
      `[OpenAI] Analyzing description: "${description.slice(0, 100)}..."`
    )

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      // Use GPT-4o for text analysis (same model as image analysis for consistency)
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          // Same prompt engineering strategy as image analysis
          // Consistency in prompts helps maintain consistent output format
          content: `You are an expert UI/UX analyzer. Analyze component descriptions and identify all UI elements mentioned.

Valid element types: ${VALID_ELEMENTS.join(", ")}

Return ONLY a JSON object with an "elements" array containing the element types found.

Example response: {"elements": ["text-input", "button", "link"]}`,
        },
        {
          role: "user",
          // Clear instruction to extract elements from natural language description
          content: `Analyze this component description and identify all UI element types present:\n\n${description}\n\nReturn a JSON object with an "elements" array.`,
        },
      ],
      // Force JSON output mode
      response_format: { type: "json_object" },
      // Low temperature for deterministic results
      temperature: 0.3,
      // Conservative token limit since element lists are short
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI API")
    }

    console.log("[OpenAI] Raw response:", content)

    // Parse the JSON response
    const parsed = JSON.parse(content)

    // Handle different possible response structures
    // GPT-4 may return various formats despite our prompt, so we check multiple possibilities
    // This defensive parsing ensures robustness across API updates and edge cases
    let elements: string[] = []
    if (Array.isArray(parsed)) {
      // Case 1: Direct array (rare but possible)
      elements = parsed
    } else if (parsed.elements && Array.isArray(parsed.elements)) {
      // Case 2: {"elements": [...]} - our expected format
      elements = parsed.elements
    } else if (
      parsed.componentElements &&
      Array.isArray(parsed.componentElements)
    ) {
      // Case 3: {"componentElements": [...]} - alternative key name
      elements = parsed.componentElements
    } else {
      // Case 4: Try to find any array in the response object
      // This catches unexpected key names while maintaining functionality
      const firstArray = Object.values(parsed).find((val) => Array.isArray(val))
      if (firstArray && Array.isArray(firstArray)) {
        elements = firstArray
      } else {
        throw new Error("Could not parse elements from response")
      }
    }

    // Validate and filter elements against our whitelist
    // This prevents hallucinated or misspelled element types from being used
    const validElements = elements.filter((el): el is ComponentElement =>
      VALID_ELEMENTS.includes(el as ComponentElement)
    )

    // Remove duplicates (GPT-4 sometimes repeats elements)
    // Using Set ensures each element appears only once
    const uniqueElements = Array.from(new Set(validElements))

    console.log(
      `[OpenAI] Detected ${uniqueElements.length} elements:`,
      uniqueElements
    )

    if (uniqueElements.length === 0) {
      console.warn("[OpenAI] No valid elements detected in description")
    }

    return uniqueElements
  } catch (error) {
    console.error("[OpenAI] Error analyzing description:", error)

    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error (${error.status}): ${error.message}`)
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to analyze component description")
  }
}

/**
 * Validates that the OpenAI API key is configured
 *
 * @returns true if API key is set, false otherwise
 */
export function isOpenAIConfigured(): boolean {
  return (
    !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your-openai-api-key-here"
  )
}
