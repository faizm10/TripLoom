"use client"

import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DashboardSearchTrigger() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-muted-foreground h-9 w-full max-w-xs justify-start gap-2 border-dashed sm:max-w-sm"
      onClick={() =>
        document.dispatchEvent(new CustomEvent("open-dashboard-command"))
      }
    >
      <SearchIcon className="size-4 shrink-0" />
      <span>Search dashboard…</span>
      <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-70 sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
