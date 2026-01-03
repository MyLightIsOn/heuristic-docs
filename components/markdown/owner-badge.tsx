import React from "react"

interface OwnerBadgeProps {
  owners: string | string[]
}

export function OwnerBadge({ owners }: OwnerBadgeProps) {
  const ownerArray = Array.isArray(owners) ? owners : [owners]

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {ownerArray.map((owner) => (
        <span
          key={owner}
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            owner.toLowerCase() === "designer"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
              : owner.toLowerCase() === "developer"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          {owner.charAt(0).toUpperCase() + owner.slice(1)}
        </span>
      ))}
    </div>
  )
}
