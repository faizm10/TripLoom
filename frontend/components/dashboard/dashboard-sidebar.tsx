"use client"

import {
  CompassIcon,
  HotelIcon,
  PlaneIcon,
  Settings2Icon,
  TrainFrontIcon,
  UserRoundPlusIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { NavItem, SectionId } from "@/components/dashboard/types"

const navItems: NavItem[] = [
  { id: "onboarding", label: "Onboarding", icon: UserRoundPlusIcon },
  { id: "flights", label: "Flights", icon: PlaneIcon, badge: "New" },
  { id: "hotels", label: "Hotels", icon: HotelIcon },
  { id: "transit", label: "Transit", icon: TrainFrontIcon },
  { id: "explore", label: "Explore Nearby", icon: CompassIcon },
  { id: "settings", label: "Settings", icon: Settings2Icon },
]

export function DashboardSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
}) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 border px-2 py-2">
          <span className="bg-primary text-primary-foreground inline-flex size-6 items-center justify-center text-xs font-bold">
            T
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">Travel OS</p>
            <p className="text-muted-foreground truncate text-[11px]">Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={item.id === activeSection}
                    onClick={() => onSectionChange(item.id)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge ? (
                      <Badge className="ml-auto rounded-none px-1 py-0 text-[10px]" variant="secondary">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="border p-2 text-xs">
          <p className="font-medium">Current Trip</p>
          <p className="text-muted-foreground mt-1">Toronto • 8 Days</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
