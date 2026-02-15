"use client"

import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader({
  title,
  subtitle,
  chatOpen,
  onToggleChat,
}: {
  title: string
  subtitle: string
  chatOpen: boolean
  onToggleChat: () => void
}) {
  return (
    <header className="bg-background/80 flex items-center justify-between border-b px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div>
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="text-muted-foreground hidden text-xs sm:block">{subtitle}</p>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onToggleChat}>
        {chatOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
        {chatOpen ? "Collapse AI" : "Open AI"}
      </Button>
    </header>
  )
}
