// lib/types/analyzer.ts

export type InputMethod = "elements" | "image" | "description" | "figma"

export type ComponentElement =
  | "text-input"
  | "checkbox"
  | "radio"
  | "textarea"
  | "select"
  | "file-upload"
  | "toggle"
  | "button"
  | "link"
  | "dropdown"
  | "menu"
  | "modal"
  | "tabs"
  | "accordion"
  | "heading"
  | "paragraph"
  | "list"
  | "table"
  | "icon"
  | "image"
  | "video"
  | "audio"

export interface AnalysisInput {
  method: InputMethod
  data: {
    elements?: ComponentElement[]
    image?: File
    description?: string
  }
}

export interface DetectedComponent {
  summary: string
  elements: ComponentElement[]
  confidence?: number
}

export interface HeuristicMatch {
  slug: string
  category: string
  title: string
  owner: ("designer" | "developer")[]
  keywords: string[]
  preview: string
  relevanceScore?: number
}

export interface AnalysisResult {
  detected: DetectedComponent
  heuristics: HeuristicMatch[]
}

export type OwnerFilter = "all" | "designer" | "developer"
