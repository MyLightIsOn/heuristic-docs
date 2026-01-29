"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TextInputProps {
  onAnalyze: (description: string) => void
  isLoading?: boolean
}

/**
 * Text Input Component
 *
 * Allows users to describe their component in natural language.
 * Features include:
 * - Large textarea for detailed descriptions
 * - Character count indicator (max 2000 characters)
 * - Validation and disabled states
 * - Loading state during analysis
 */
export function TextInput({ onAnalyze, isLoading = false }: TextInputProps) {
  const [description, setDescription] = React.useState("")
  const maxLength = 2000

  const handleAnalyze = () => {
    if (description.trim()) {
      onAnalyze(description.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isDisabled) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  const isDisabled = isLoading || description.trim().length === 0
  const isNearLimit = description.length > maxLength * 0.9 // 90% of max
  const isOverLimit = description.length > maxLength

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="component-description"
          className="block text-sm font-medium"
        >
          Describe your component
        </label>
        <textarea
          id="component-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Describe your component, e.g., 'A login form with email and password fields, a submit button, and a forgot password link'"
          rows={6}
          maxLength={maxLength}
          className={cn(
            "flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
            "min-h-[150px] resize-y"
          )}
          aria-describedby="character-count"
          aria-invalid={isOverLimit}
        />
        <div
          id="character-count"
          className={cn(
            "flex items-center justify-between text-xs",
            isOverLimit && "text-destructive",
            isNearLimit &&
              !isOverLimit &&
              "text-orange-600 dark:text-orange-500"
          )}
        >
          <span className="text-muted-foreground">
            Tip: Press{" "}
            <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none">
              <span className="text-xs">⌘</span>Enter
            </kbd>{" "}
            to analyze
          </span>
          <span
            className={cn(
              "font-medium tabular-nums",
              !isNearLimit && "text-muted-foreground"
            )}
          >
            {description.length} / {maxLength}
          </span>
        </div>
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={isDisabled}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <svg
              className="size-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Analyzing...
          </>
        ) : (
          "Analyze Component"
        )}
      </Button>

      {isOverLimit && (
        <p className="text-sm text-destructive" role="alert">
          Description exceeds maximum length of {maxLength} characters. Please
          shorten your description.
        </p>
      )}
    </div>
  )
}
