"use client"

import * as React from "react"

import { DashboardChatPanel } from "@/components/dashboard/dashboard-chat-panel"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardMainSection } from "@/components/dashboard/dashboard-main-section"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { sectionCopy } from "@/components/dashboard/section-copy"
import type { SectionId } from "@/components/dashboard/types"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = React.useState<SectionId>("onboarding")
  const [chatOpen, setChatOpen] = React.useState(true)

  const active = sectionCopy[activeSection]

  return (
    <SidebarProvider>
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <SidebarInset>
        <div className="flex h-svh min-h-0 flex-col">
          <DashboardHeader
            title={active.title}
            subtitle={active.subtitle}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((prev) => !prev)}
          />

          <div className="flex min-h-0 flex-1">
            <DashboardMainSection title={active.title} subtitle={active.subtitle} />
            <DashboardChatPanel chatOpen={chatOpen} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
