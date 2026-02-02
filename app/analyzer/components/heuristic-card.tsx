import { Link } from "@/lib/transition"
import type { HeuristicMatch } from "@/lib/types/analyzer"
import { OwnerBadge } from "@/components/markdown/owner-badge"

interface HeuristicCardProps {
  heuristic: HeuristicMatch
}

export function HeuristicCard({ heuristic }: HeuristicCardProps) {
  return (
    <div
      data-testid="heuristic-card"
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-md transition-shadow duration-300 ease-in-out hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex flex-1 flex-col p-4">
        {/* Category Badge */}
        <div className="mb-2">
          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {heuristic.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-all duration-300 group-hover:font-bold dark:text-gray-100">
          {heuristic.title}
        </h3>

        {/* Preview Text */}
        <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-400">
          {heuristic.preview}
        </p>

        {/* Owner Badges */}
        {heuristic.owner && heuristic.owner.length > 0 && (
          <div className="mb-3">
            <OwnerBadge owners={heuristic.owner} />
          </div>
        )}

        {/* View Link */}
        <Link
          href={`/docs${heuristic.slug}`}
          className="inline-flex items-center text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Full Heuristic
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
