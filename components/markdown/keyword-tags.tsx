import React from "react"

interface KeywordTagsProps {
  keywords: string[]
}

export function KeywordTags({ keywords }: KeywordTagsProps) {
  if (!keywords || keywords.length === 0) {
    return null
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {keyword}
        </span>
      ))}
    </div>
  )
}
