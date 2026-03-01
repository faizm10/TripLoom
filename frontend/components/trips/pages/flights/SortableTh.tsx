"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

type Props<K extends string> = {
  sortKey: K
  currentSortBy: K | null
  currentSortDir: "asc" | "desc"
  label: string
  onSort: (key: K) => void
}

export function SortableTh<K extends string>({
  sortKey,
  currentSortBy,
  currentSortDir,
  label,
  onSort,
}: Props<K>) {
  const active = currentSortBy === sortKey
  return (
    <th className="p-2 text-left font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded hover:underline focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {label}
        {active ? (
          currentSortDir === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : null}
      </button>
    </th>
  )
}
