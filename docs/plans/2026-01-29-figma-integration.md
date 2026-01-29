# Figma Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to analyze Figma designs by providing a Figma file URL, automatically fetching and analyzing the design using the Figma REST API and existing image analysis pipeline.

**Architecture:** Two-phase approach: (1) URL-based integration using Figma REST API to fetch and export frames as images, then analyze with existing GPT-4 Vision pipeline; (2) Future: full Figma plugin with layer-based detection. This plan covers Phase 1 only.

**Tech Stack:** Figma REST API, Next.js API routes, existing OpenAI GPT-4 Vision analysis, React components

---

## Prerequisites

### Environment Setup

**Required:**
- Figma Personal Access Token (get from https://www.figma.com/developers/api#access-tokens)
- Add to `.env.local`: `FIGMA_ACCESS_TOKEN=figd_...`

**Documentation:**
- Figma REST API: https://www.figma.com/developers/api
- File nodes endpoint: https://api.figma.com/v1/files/:file_key/nodes
- Image export endpoint: https://api.figma.com/v1/images/:file_key

---

## Task 1: Add Figma Types

**Files:**
- Modify: `lib/types/analyzer.ts`

**Step 1: Add Figma-specific types to AnalysisInput interface**

Update the `AnalysisInput` interface to include Figma URL data:

```typescript
export interface AnalysisInput {
  method: InputMethod
  data: {
    elements?: ComponentElement[]
    image?: File
    description?: string
    figmaUrl?: string  // Add this
  }
}
```

**Step 2: Add Figma URL parsing types**

Add these new types at the end of the file:

```typescript
export interface FigmaUrlParts {
  fileKey: string
  nodeId?: string
}

export interface FigmaNodeData {
  name: string
  type: string
  imageUrl: string
}
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/types/analyzer.ts
git commit -m "feat(figma): add Figma types to analyzer"
```

---

## Task 2: Create Figma URL Parser Utility

**Files:**
- Create: `lib/analyzer/figma-parser.ts`

**Step 1: Create utility to parse Figma URLs**

Create the file with URL parsing logic:

```typescript
// lib/analyzer/figma-parser.ts

import type { FigmaUrlParts } from "@/lib/types/analyzer"

/**
 * Parses a Figma URL to extract file key and optional node ID.
 *
 * Supported URL formats:
 * - https://www.figma.com/file/FILE_KEY/Title
 * - https://www.figma.com/file/FILE_KEY/Title?node-id=123-456
 * - https://www.figma.com/design/FILE_KEY/Title?node-id=123-456
 *
 * @param url - The Figma URL to parse
 * @returns Object with fileKey and optional nodeId
 * @throws Error if URL is invalid or missing file key
 */
export function parseFigmaUrl(url: string): FigmaUrlParts {
  try {
    const urlObj = new URL(url)

    // Validate domain
    if (!urlObj.hostname.includes("figma.com")) {
      throw new Error("URL must be from figma.com")
    }

    // Extract file key from path
    // Path format: /file/FILE_KEY/... or /design/FILE_KEY/...
    const pathParts = urlObj.pathname.split("/").filter(Boolean)
    const fileKeyIndex = pathParts.findIndex(
      (part) => part === "file" || part === "design"
    )

    if (fileKeyIndex === -1 || fileKeyIndex + 1 >= pathParts.length) {
      throw new Error("Invalid Figma URL: missing file key")
    }

    const fileKey = pathParts[fileKeyIndex + 1]

    if (!fileKey || fileKey.length < 10) {
      throw new Error("Invalid Figma URL: file key too short")
    }

    // Extract node ID from query params if present
    const nodeIdParam = urlObj.searchParams.get("node-id")
    let nodeId: string | undefined

    if (nodeIdParam) {
      // Convert node-id format (123-456) to node ID format (123:456)
      nodeId = nodeIdParam.replace("-", ":")
    }

    return {
      fileKey,
      nodeId,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid URL")) {
      throw new Error("Invalid URL format")
    }
    throw error
  }
}

/**
 * Validates that a Figma access token is configured.
 *
 * @returns true if token is set, false otherwise
 */
export function isFigmaConfigured(): boolean {
  return (
    !!process.env.FIGMA_ACCESS_TOKEN &&
    process.env.FIGMA_ACCESS_TOKEN !== "your-figma-token-here"
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/analyzer/figma-parser.ts
git commit -m "feat(figma): add URL parser utility"
```

---

## Task 3: Create Figma API Client

**Files:**
- Create: `lib/analyzer/figma-client.ts`

**Step 1: Create Figma API client for fetching and exporting frames**

```typescript
// lib/analyzer/figma-client.ts

import type { FigmaUrlParts, FigmaNodeData } from "@/lib/types/analyzer"

const FIGMA_API_BASE = "https://api.figma.com/v1"

/**
 * Fetches a Figma file's node data.
 *
 * @param fileKey - The Figma file key
 * @param nodeId - Optional specific node ID to fetch
 * @returns Node data including name and type
 * @throws Error if API request fails
 */
async function fetchFileNode(
  fileKey: string,
  nodeId?: string
): Promise<FigmaNodeData> {
  const token = process.env.FIGMA_ACCESS_TOKEN

  if (!token) {
    throw new Error("FIGMA_ACCESS_TOKEN not configured")
  }

  try {
    // Fetch file data
    const fileUrl = nodeId
      ? `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeId}`
      : `${FIGMA_API_BASE}/files/${fileKey}`

    console.log(`[Figma] Fetching file data: ${fileKey}${nodeId ? ` node: ${nodeId}` : ""}`)

    const fileResponse = await fetch(fileUrl, {
      headers: {
        "X-Figma-Token": token,
      },
    })

    if (!fileResponse.ok) {
      if (fileResponse.status === 403) {
        throw new Error("Invalid Figma access token or insufficient permissions")
      }
      if (fileResponse.status === 404) {
        throw new Error("Figma file not found or not accessible")
      }
      throw new Error(`Figma API error: ${fileResponse.status} ${fileResponse.statusText}`)
    }

    const fileData = await fileResponse.json()

    // Extract node data
    let nodeName = "Untitled"
    let nodeType = "FRAME"

    if (nodeId && fileData.nodes && fileData.nodes[nodeId]) {
      const node = fileData.nodes[nodeId].document
      nodeName = node.name || nodeName
      nodeType = node.type || nodeType
    } else if (fileData.document) {
      nodeName = fileData.name || nodeName
    }

    // Request image export
    const exportUrl = `${FIGMA_API_BASE}/images/${fileKey}?ids=${nodeId || fileData.document.id}&format=png&scale=2`

    console.log(`[Figma] Requesting image export`)

    const exportResponse = await fetch(exportUrl, {
      headers: {
        "X-Figma-Token": token,
      },
    })

    if (!exportResponse.ok) {
      throw new Error(`Figma image export failed: ${exportResponse.status}`)
    }

    const exportData = await exportResponse.json()

    // Get image URL from export response
    const imageUrl = nodeId
      ? exportData.images[nodeId]
      : Object.values(exportData.images)[0]

    if (!imageUrl || typeof imageUrl !== "string") {
      throw new Error("Failed to get image URL from Figma export")
    }

    console.log(`[Figma] Image exported successfully`)

    return {
      name: nodeName,
      type: nodeType,
      imageUrl: imageUrl as string,
    }
  } catch (error) {
    console.error("[Figma] Error fetching file:", error)
    throw error instanceof Error ? error : new Error("Failed to fetch Figma file")
  }
}

/**
 * Fetches a Figma frame as an image buffer.
 *
 * @param parts - Parsed Figma URL parts (fileKey, nodeId)
 * @returns Object with image buffer and node metadata
 * @throws Error if fetch or export fails
 */
export async function fetchFigmaImage(parts: FigmaUrlParts): Promise<{
  imageBuffer: Buffer
  nodeName: string
}> {
  const nodeData = await fetchFileNode(parts.fileKey, parts.nodeId)

  console.log(`[Figma] Downloading image from: ${nodeData.imageUrl}`)

  // Fetch the actual image
  const imageResponse = await fetch(nodeData.imageUrl)

  if (!imageResponse.ok) {
    throw new Error("Failed to download Figma image")
  }

  const arrayBuffer = await imageResponse.arrayBuffer()
  const imageBuffer = Buffer.from(arrayBuffer)

  console.log(`[Figma] Image downloaded: ${imageBuffer.length} bytes`)

  return {
    imageBuffer,
    nodeName: nodeData.name,
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add lib/analyzer/figma-client.ts
git commit -m "feat(figma): add Figma API client"
```

---

## Task 4: Create Figma API Route

**Files:**
- Create: `app/api/analyzer/figma/route.ts`

**Step 1: Create API route to handle Figma URL analysis**

```typescript
// app/api/analyzer/figma/route.ts

import { NextRequest, NextResponse } from "next/server"

import { analyzeComponentImage } from "@/lib/analyzer/openai-client"
import { parseFigmaUrl, isFigmaConfigured } from "@/lib/analyzer/figma-parser"
import { fetchFigmaImage } from "@/lib/analyzer/figma-client"
import type { ComponentElement } from "@/lib/types/analyzer"

/**
 * POST /api/analyzer/figma
 *
 * Analyzes a Figma design by URL using the Figma REST API.
 *
 * Request format (application/json):
 * {
 *   "figmaUrl": "https://www.figma.com/file/FILE_KEY/Title?node-id=NODE_ID"
 * }
 *
 * Response format:
 * {
 *   "detected": {
 *     "summary": "Component with 2 text inputs, 1 button",
 *     "elements": ["text-input", "button"],
 *     "confidence": 0.85,
 *     "nodeName": "Login Form"
 *   }
 * }
 *
 * Error responses:
 * - 400: Invalid Figma URL or missing URL
 * - 401: Figma access token not configured
 * - 403: Invalid token or insufficient permissions
 * - 404: Figma file not found
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Figma token is configured
    if (!isFigmaConfigured()) {
      return NextResponse.json(
        {
          error:
            "Figma access token is not configured. Please set FIGMA_ACCESS_TOKEN environment variable.",
        },
        { status: 401 }
      )
    }

    const contentType = request.headers.get("content-type") || ""

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Content-Type must be application/json",
        },
        { status: 400 }
      )
    }

    let body: { figmaUrl?: string }

    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { figmaUrl } = body

    if (!figmaUrl || typeof figmaUrl !== "string" || figmaUrl.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid 'figmaUrl' field. Please provide a valid Figma URL.",
        },
        { status: 400 }
      )
    }

    console.log(`[API] Analyzing Figma URL: ${figmaUrl}`)

    // Parse Figma URL
    let urlParts
    try {
      urlParts = parseFigmaUrl(figmaUrl)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid URL"
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Fetch image from Figma
    let imageBuffer: Buffer
    let nodeName: string

    try {
      const figmaData = await fetchFigmaImage(urlParts)
      imageBuffer = figmaData.imageBuffer
      nodeName = figmaData.nodeName
    } catch (error) {
      console.error("[API] Error fetching Figma image:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to fetch Figma design"

      // Map specific errors to status codes
      if (errorMessage.includes("Invalid Figma access token")) {
        return NextResponse.json({ error: errorMessage }, { status: 403 })
      }
      if (errorMessage.includes("not found")) {
        return NextResponse.json({ error: errorMessage }, { status: 404 })
      }

      return NextResponse.json(
        { error: `Failed to fetch Figma design: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Convert buffer to File object for image analysis
    const imageFile = new File([imageBuffer], `${nodeName}.png`, {
      type: "image/png",
    })

    // Analyze using existing image analysis
    let elements: ComponentElement[]

    try {
      elements = await analyzeComponentImage(imageFile)
    } catch (error) {
      console.error("[API] Error analyzing Figma image:", error)

      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze design"

      return NextResponse.json(
        { error: `Failed to analyze Figma design: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Generate summary
    const summary = generateSummary(elements, nodeName)
    const confidence = calculateConfidence(elements)

    return NextResponse.json({
      detected: {
        summary,
        elements,
        confidence,
        nodeName,
      },
    })
  } catch (error) {
    console.error("[API] Unexpected error in Figma route:", error)

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred"

    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}

function generateSummary(elements: ComponentElement[], nodeName: string): string {
  if (elements.length === 0) {
    return `No UI elements detected in ${nodeName}`
  }

  const elementCounts = new Map<string, number>()
  elements.forEach((element) => {
    elementCounts.set(element, (elementCounts.get(element) || 0) + 1)
  })

  const parts: string[] = []
  elementCounts.forEach((count, element) => {
    const elementName = element.replace(/-/g, " ")
    const plural = count > 1 ? "s" : ""
    parts.push(`${count} ${elementName}${plural}`)
  })

  if (parts.length === 1) {
    return `${nodeName} with ${parts[0]}`
  } else if (parts.length === 2) {
    return `${nodeName} with ${parts[0]} and ${parts[1]}`
  } else {
    const lastPart = parts.pop()
    return `${nodeName} with ${parts.join(", ")}, and ${lastPart}`
  }
}

function calculateConfidence(elements: ComponentElement[]): number {
  if (elements.length === 0) return 0.0
  if (elements.length === 1) return 0.7
  if (elements.length <= 3) return 0.85
  return 0.95
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds, new route appears: `ƒ /api/analyzer/figma`

**Step 4: Commit**

```bash
git add app/api/analyzer/figma/route.ts
git commit -m "feat(figma): add Figma API route"
```

---

## Task 5: Create Figma Input Component

**Files:**
- Create: `app/analyzer/components/figma-input.tsx`

**Step 1: Create UI component for Figma URL input**

```typescript
// app/analyzer/components/figma-input.tsx
"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface FigmaInputProps {
  onAnalyze: (figmaUrl: string) => void
  isLoading?: boolean
}

export function FigmaInput({ onAnalyze, isLoading = false }: FigmaInputProps) {
  const [figmaUrl, setFigmaUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = () => {
    setError(null)

    // Basic validation
    if (!figmaUrl.trim()) {
      setError("Please enter a Figma URL")
      return
    }

    if (!figmaUrl.includes("figma.com")) {
      setError("Please enter a valid Figma URL")
      return
    }

    onAnalyze(figmaUrl)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && figmaUrl.trim()) {
      handleAnalyze()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="figma-url"
          className="text-sm font-medium text-foreground"
        >
          Figma File or Frame URL
        </label>
        <input
          id="figma-url"
          type="text"
          placeholder="https://www.figma.com/file/..."
          value={figmaUrl}
          onChange={(e) => {
            setFigmaUrl(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Paste a link to a Figma file or specific frame
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-muted bg-muted/50 p-4">
        <h4 className="mb-2 text-sm font-medium text-foreground">
          How to get a Figma URL:
        </h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-medium">1.</span>
            <span>Open your design in Figma</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">2.</span>
            <span>
              Select a frame (optional - if not selected, analyzes whole page)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">3.</span>
            <span>Click Share → Copy link</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">4.</span>
            <span>Paste the URL above</span>
          </li>
        </ol>
      </div>

      <div className="flex justify-between">
        <a
          href="https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Learn about Figma sharing
        </a>

        <Button
          onClick={handleAnalyze}
          disabled={isLoading || !figmaUrl.trim()}
        >
          {isLoading ? "Analyzing..." : "Analyze Figma Design"}
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/analyzer/components/figma-input.tsx
git commit -m "feat(figma): add Figma input component"
```

---

## Task 6: Update Input Tabs Component

**Files:**
- Modify: `app/analyzer/components/input-tabs.tsx`

**Step 1: Import FigmaInput component**

Add to imports at top of file:

```typescript
import { FigmaInput } from "./figma-input"
```

**Step 2: Add Figma analyze handler**

Add this function inside the InputTabs component (after other handlers):

```typescript
  const handleFigmaAnalyze = (figmaUrl: string) => {
    onAnalyze({
      method: "figma",
      data: { figmaUrl },
    })
  }
```

**Step 3: Replace "Coming Soon" content with FigmaInput**

Find the TabsContent for "figma" and replace with:

```typescript
      <TabsContent value="figma">
        <FigmaInput onAnalyze={handleFigmaAnalyze} isLoading={isLoading} />
      </TabsContent>
```

**Step 4: Update tab label to remove "(disabled)"**

Find the TabsTrigger for figma and update:

```typescript
        <TabsTrigger value="figma">Figma Design</TabsTrigger>
```

**Step 5: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add app/analyzer/components/input-tabs.tsx
git commit -m "feat(figma): integrate Figma input into tabs"
```

---

## Task 7: Update Analyzer Client Component

**Files:**
- Modify: `app/analyzer/components/analyzer-client.tsx`

**Step 1: Add Figma analysis case to handleAnalyze**

Find the `handleAnalyze` function and add this case after the "description" case (before the closing try block):

```typescript
      } else if (input.method === "figma" && input.data.figmaUrl) {
        // Send Figma URL to API
        const response = await fetch("/api/analyzer/figma", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            figmaUrl: input.data.figmaUrl,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[Analyzer] Figma analysis failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          })
          throw new Error(
            errorData.error || `Failed to analyze Figma design (${response.status})`
          )
        }

        const data = await response.json()
        detected = data.detected

        // Call API to match heuristics based on detected elements
        const matchResponse = await fetch("/api/analyzer/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            elements: detected.elements,
          }),
        })

        if (!matchResponse.ok) {
          const errorData = await matchResponse.json()
          console.error("[Analyzer] Heuristic matching failed:", {
            status: matchResponse.status,
            statusText: matchResponse.statusText,
            error: errorData,
          })
          throw new Error(
            errorData.error ||
              `Failed to match heuristics (${matchResponse.status})`
          )
        }

        const matchData = await matchResponse.json()
        heuristics = matchData.heuristics

        setAnalysisResult({
          detected,
          heuristics,
        })
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/analyzer/components/analyzer-client.tsx
git commit -m "feat(figma): add Figma analysis to client"
```

---

## Task 8: Update Documentation

**Files:**
- Modify: `docs/ANALYZER_IMPLEMENTATION.md`
- Create: `docs/FIGMA_INTEGRATION.md`

**Step 1: Create Figma integration documentation**

```markdown
# Figma Integration

## Overview

The Figma integration allows users to analyze Figma designs directly by providing a Figma file or frame URL. The analyzer fetches the design from Figma, exports it as an image, and analyzes it using the same AI-powered pipeline as image uploads.

## Setup

### 1. Get Figma Access Token

1. Go to https://www.figma.com/settings
2. Scroll to "Personal access tokens"
3. Click "Generate new token"
4. Give it a name (e.g., "Heuristics Analyzer")
5. Copy the token (starts with `figd_`)

### 2. Configure Environment

Add to `.env.local`:

```env
FIGMA_ACCESS_TOKEN=figd_YOUR_TOKEN_HERE
```

### 3. Restart Dev Server

```bash
pnpm dev
```

## How It Works

### User Flow

1. User selects "Figma Design" tab in analyzer
2. Pastes Figma URL (file or specific frame)
3. Clicks "Analyze Figma Design"
4. Backend:
   - Parses URL to extract file key and node ID
   - Calls Figma REST API to fetch file data
   - Exports frame as PNG image (2x scale)
   - Downloads image
   - Analyzes with GPT-4 Vision (same as image upload)
   - Matches detected elements to heuristics
5. Results displayed with filter and export options

### Supported URL Formats

- `https://www.figma.com/file/FILE_KEY/Title`
- `https://www.figma.com/file/FILE_KEY/Title?node-id=123-456`
- `https://www.figma.com/design/FILE_KEY/Title?node-id=123-456`

### Architecture

```
User Input (Figma URL)
    ↓
Parse URL (figma-parser.ts)
    ↓
Fetch File Data (figma-client.ts)
    ↓
Export as PNG (Figma API)
    ↓
Download Image
    ↓
Analyze Image (openai-client.ts)
    ↓
Match Heuristics (heuristic-matcher.ts)
    ↓
Display Results
```

## API Endpoints

### POST /api/analyzer/figma

Analyzes a Figma design by URL.

**Request:**
```json
{
  "figmaUrl": "https://www.figma.com/file/abc123/Design?node-id=1-2"
}
```

**Response:**
```json
{
  "detected": {
    "summary": "Login Form with 2 text inputs, 1 button",
    "elements": ["text-input", "button"],
    "confidence": 0.85,
    "nodeName": "Login Form"
  }
}
```

**Error Codes:**
- `400` - Invalid URL or missing URL
- `401` - Figma token not configured
- `403` - Invalid token or insufficient permissions
- `404` - File not found or not accessible
- `500` - Server error

## Files

### New Files
- `lib/analyzer/figma-parser.ts` - URL parsing utilities
- `lib/analyzer/figma-client.ts` - Figma REST API client
- `app/api/analyzer/figma/route.ts` - API route handler
- `app/analyzer/components/figma-input.tsx` - UI component
- `docs/FIGMA_INTEGRATION.md` - This documentation

### Modified Files
- `lib/types/analyzer.ts` - Added Figma types
- `app/analyzer/components/input-tabs.tsx` - Integrated Figma input
- `app/analyzer/components/analyzer-client.tsx` - Added Figma handler

## Limitations

### Current (Phase 1)
- Exports entire frame/page as image
- Uses visual analysis (same as image upload)
- Cannot detect layer structure or properties
- Requires public or accessible Figma file
- Rate limited by Figma API (personal tokens: 100 req/hour)

### Future (Phase 2 - Plugin)
- Direct layer analysis (smarter detection)
- Real-time analysis in Figma
- No export/download needed
- Access to design tokens and styles
- Component metadata extraction

## Troubleshooting

### "Invalid Figma access token"
- Token expired or revoked
- Token doesn't have file access
- Solution: Generate new token in Figma settings

### "Figma file not found"
- File is private and token doesn't have access
- File was deleted
- URL is incorrect
- Solution: Share file publicly or with token owner

### "Failed to download Figma image"
- Figma export service temporarily down
- Network issues
- Solution: Retry after a moment

### Rate Limiting
- Figma limits personal tokens to 100 requests/hour
- Each analysis uses 2 API calls (file fetch + export)
- Solution: Wait or upgrade to Figma API plan

## Future Enhancements

1. **Figma Plugin** - Native plugin for in-app analysis
2. **Team Library Support** - Analyze design system components
3. **Batch Analysis** - Analyze multiple frames at once
4. **Layer Detection** - Parse layer structure for smarter element detection
5. **Style Analysis** - Check color contrast, spacing from design tokens
6. **Component Variants** - Analyze all variants of a component
7. **Version History** - Track accessibility improvements over time
```

**Step 2: Update main analyzer documentation**

Add to the "Future Enhancements" section in `docs/ANALYZER_IMPLEMENTATION.md`:

```markdown
## Figma Integration (Completed)

The Figma integration is now implemented! See `docs/FIGMA_INTEGRATION.md` for full details.

**Features:**
- Analyze designs by Figma URL (file or frame)
- Automatic image export via Figma REST API
- Same AI-powered analysis as image uploads
- Support for public and private files (with token)

**Setup:**
- Get Figma personal access token
- Add `FIGMA_ACCESS_TOKEN` to `.env.local`
- Restart dev server

**Next Steps:**
- Phase 2: Build native Figma plugin
- Direct layer analysis (no image export needed)
- Real-time in-app analysis
```

**Step 3: Commit**

```bash
git add docs/FIGMA_INTEGRATION.md docs/ANALYZER_IMPLEMENTATION.md
git commit -m "docs(figma): add Figma integration documentation"
```

---

## Task 9: Add Environment Variable Documentation

**Files:**
- Modify: `.env.example` or Create if doesn't exist

**Step 1: Create or update .env.example**

```env
# OpenAI API Key (required for image and text analysis)
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Figma Access Token (required for Figma integration)
# Get from: https://www.figma.com/settings (Personal access tokens section)
FIGMA_ACCESS_TOKEN=figd_...
```

**Step 2: Update README if it exists**

If `README.md` has environment variables section, add:

```markdown
### Environment Variables

Create a `.env.local` file with:

```env
OPENAI_API_KEY=sk-proj-...
FIGMA_ACCESS_TOKEN=figd_...
```

See `.env.example` for details.
```

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add Figma token to env example"
```

---

## Task 10: Final Testing and Build

**Files:**
- All modified files

**Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds with new route:
```
ƒ /api/analyzer/figma
```

**Step 2: Verify all routes exist**

Expected output should include:
```
○ /analyzer
ƒ /api/analyzer
ƒ /api/analyzer/figma
ƒ /api/analyzer/match
```

**Step 3: Manual testing checklist**

With dev server running (`pnpm dev`):

1. **Navigate to /analyzer**
   - [ ] Page loads
   - [ ] Four tabs visible: Pick Elements, Upload Image, Describe, Figma Design
   - [ ] Figma tab is not disabled

2. **Figma Tab UI**
   - [ ] Tab switches to Figma input
   - [ ] URL input field visible
   - [ ] Instructions visible
   - [ ] "Learn about Figma sharing" link works

3. **Figma Analysis (requires token)**
   - [ ] Paste valid Figma URL
   - [ ] Click "Analyze Figma Design"
   - [ ] Loading state shows
   - [ ] Results appear with detected elements
   - [ ] Heuristics are displayed
   - [ ] Can filter by owner
   - [ ] Can export PDF/Markdown

4. **Error Handling**
   - [ ] Empty URL shows validation error
   - [ ] Invalid URL shows error
   - [ ] Missing token shows 401 error
   - [ ] Invalid token shows 403 error
   - [ ] Private file shows 404 error

**Step 4: Create final commit**

```bash
git add -A
git commit -m "feat(figma): complete Figma integration

- Add Figma URL parser and API client
- Create Figma API route (/api/analyzer/figma)
- Add Figma input UI component
- Integrate with existing analyzer workflow
- Add comprehensive documentation
- Support public and private Figma files
- Export frames as images for AI analysis

Closes #[issue-number] (if applicable)"
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Set `FIGMA_ACCESS_TOKEN` in production environment
- [ ] Test with production Figma token
- [ ] Verify rate limiting is acceptable
- [ ] Update user documentation
- [ ] Add analytics tracking (optional)
- [ ] Monitor error rates
- [ ] Consider adding Figma-specific error messages to UI

---

## Future Work (Phase 2 - Figma Plugin)

The next phase would be building a native Figma plugin:

1. **Plugin Development**
   - Create plugin manifest
   - Build plugin UI with React
   - Use Figma Plugin API to read layer data
   - Direct element detection (no image export)

2. **Smarter Detection**
   - Parse layer types (TEXT, RECTANGLE, etc.)
   - Read layer names and properties
   - Detect form inputs, buttons from structure
   - Extract actual text content

3. **In-App Experience**
   - Show results in Figma sidebar
   - Highlight problematic layers
   - Export checklist directly from Figma
   - Real-time updates as design changes

4. **Advanced Features**
   - Design token analysis (colors, spacing)
   - Contrast checking with actual values
   - Component variant analysis
   - Team library integration

See Figma Plugin API: https://www.figma.com/plugin-docs/

---

## Success Criteria

✅ Users can analyze Figma designs by URL
✅ Supports both full files and specific frames
✅ Automatic image export and analysis
✅ Same quality as image upload analysis
✅ Clear error messages for common issues
✅ Comprehensive documentation
✅ Production-ready with proper token handling
