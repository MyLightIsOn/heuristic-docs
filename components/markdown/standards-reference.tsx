import React from "react"
import { FiExternalLink } from "react-icons/fi"

interface StandardsReferenceProps {
  wcag?: string[]
  en301549?: string[]
}

export function StandardsReference({
  wcag = [],
  en301549 = [],
}: StandardsReferenceProps) {
  if (wcag.length === 0 && en301549.length === 0) {
    return null
  }

  const getWCAGUrl = (criterion: string) => {
    // Convert criterion like "2.4.7" to URL-friendly format
    const parts = criterion.split(".")
    if (parts.length === 3) {
      // Format: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible
      // This is simplified - you may need to add a mapping for actual criterion names
      return `https://www.w3.org/WAI/WCAG21/Understanding/`
    }
    return `https://www.w3.org/WAI/WCAG21/`
  }

  const getEN301549Url = (reference: string) => {
    return `https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf`
  }

  return (
    <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Related Standards
      </h3>

      {wcag.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            WCAG 2.1:
          </p>
          <div className="flex flex-wrap gap-2">
            {wcag.map((criterion) => (
              <a
                key={criterion}
                href={getWCAGUrl(criterion)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-sm text-zinc-700 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
              >
                {criterion}
                <FiExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {en301549.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            EN 301 549:
          </p>
          <div className="flex flex-wrap gap-2">
            {en301549.map((reference) => (
              <a
                key={reference}
                href={getEN301549Url(reference)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-sm text-zinc-700 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
              >
                {reference}
                <FiExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
