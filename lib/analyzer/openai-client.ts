// lib/analyzer/openai-client.ts

import OpenAI from "openai"

import type { ComponentElement } from "@/lib/types/analyzer"

/**
 * Lazily initialize OpenAI client with API key from environment variables.
 * This prevents instantiation during build time when the API key may not be available.
 */
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

/**
 * List of all valid component elements that can be detected
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
    // Convert image to base64 for GPT-4 Vision
    const buffer = await image.arrayBuffer()
    const base64Image = Buffer.from(buffer).toString("base64")
    const imageUrl = `data:${image.type};base64,${base64Image}`

    console.log(`[OpenAI] Analyzing image: ${image.name} (${image.size} bytes)`)

    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert UI/UX analyzer. Analyze component images and identify all UI elements present.

Valid element types: ${VALID_ELEMENTS.join(", ")}

Return ONLY a JSON array of element types found, with no additional text or explanation.

Example response: ["text-input", "button", "link"]`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this UI component image and list all the element types you can identify. Return only a JSON array of element types.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
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
    let elements: string[] = []
    if (Array.isArray(parsed)) {
      elements = parsed
    } else if (parsed.elements && Array.isArray(parsed.elements)) {
      elements = parsed.elements
    } else if (
      parsed.componentElements &&
      Array.isArray(parsed.componentElements)
    ) {
      elements = parsed.componentElements
    } else {
      // Try to find any array in the response
      const firstArray = Object.values(parsed).find((val) => Array.isArray(val))
      if (firstArray && Array.isArray(firstArray)) {
        elements = firstArray
      } else {
        throw new Error("Could not parse elements from response")
      }
    }

    // Validate and filter elements
    const validElements = elements.filter((el): el is ComponentElement =>
      VALID_ELEMENTS.includes(el as ComponentElement)
    )

    // Remove duplicates
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

    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error (${error.status}): ${error.message}`)
    }

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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert UI/UX analyzer. Analyze component descriptions and identify all UI elements mentioned.

Valid element types: ${VALID_ELEMENTS.join(", ")}

Return ONLY a JSON object with an "elements" array containing the element types found.

Example response: {"elements": ["text-input", "button", "link"]}`,
        },
        {
          role: "user",
          content: `Analyze this component description and identify all UI element types present:\n\n${description}\n\nReturn a JSON object with an "elements" array.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
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
    let elements: string[] = []
    if (Array.isArray(parsed)) {
      elements = parsed
    } else if (parsed.elements && Array.isArray(parsed.elements)) {
      elements = parsed.elements
    } else if (
      parsed.componentElements &&
      Array.isArray(parsed.componentElements)
    ) {
      elements = parsed.componentElements
    } else {
      // Try to find any array in the response
      const firstArray = Object.values(parsed).find((val) => Array.isArray(val))
      if (firstArray && Array.isArray(firstArray)) {
        elements = firstArray
      } else {
        throw new Error("Could not parse elements from response")
      }
    }

    // Validate and filter elements
    const validElements = elements.filter((el): el is ComponentElement =>
      VALID_ELEMENTS.includes(el as ComponentElement)
    )

    // Remove duplicates
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
