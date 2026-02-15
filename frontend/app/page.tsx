"use client"

import * as React from "react"
import {
  BotIcon,
  CompassIcon,
  PlaneIcon,
  Settings2Icon,
  SparklesIcon,
  TrainFrontIcon,
  HotelIcon,
  UserRoundPlusIcon,
  SendIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type SectionId =
  | "onboarding"
  | "flights"
  | "hotels"
  | "transit"
  | "explore"
  | "settings"

const navItems: {
  id: SectionId
  label: string
  icon: React.ComponentType<React.ComponentProps<"svg">>
  badge?: string
}[] = [
  { id: "onboarding", label: "Onboarding", icon: UserRoundPlusIcon },
  { id: "flights", label: "Flights", icon: PlaneIcon, badge: "New" },
  { id: "hotels", label: "Hotels", icon: HotelIcon },
  { id: "transit", label: "Transit", icon: TrainFrontIcon },
  { id: "explore", label: "Explore Nearby", icon: CompassIcon },
  { id: "settings", label: "Settings", icon: Settings2Icon },
]

const sectionCopy: Record<SectionId, { title: string; subtitle: string }> = {
  onboarding: {
    title: "Get Trip-Ready",
    subtitle:
      "Complete traveler profile, preferences, and destination details before you start booking.",
  },
  flights: {
    title: "Flight Workspace",
    subtitle:
      "Compare one-way, round-trip, and multi-city offers with quick filters and shortlists.",
  },
  hotels: {
    title: "Hotel Workspace",
    subtitle:
      "Review availability, amenities, policy details, and add selected stays to itinerary.",
  },
  transit: {
    title: "Transit Planner",
    subtitle:
      "Build day routes and compare duration and transfer load for each movement.",
  },
  explore: {
    title: "Nearby Attractions",
    subtitle:
      "Surface must-see spots and hidden gems near your stay and save them in one click.",
  },
  settings: {
    title: "Workspace Settings",
    subtitle:
      "Manage trip defaults, notifications, collaboration permissions, and AI preferences.",
  },
}

export default function Page() {
  const [activeSection, setActiveSection] = React.useState<SectionId>("onboarding")
  const [chatOpen, setChatOpen] = React.useState(true)

  const active = sectionCopy[activeSection]

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 border px-2 py-2">
            <span className="bg-primary text-primary-foreground inline-flex size-6 items-center justify-center text-xs font-bold">
              T
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">Travel OS</p>
              <p className="text-muted-foreground truncate text-[11px]">
                Dashboard
              </p>
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
                      onClick={() => setActiveSection(item.id)}
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

      <SidebarInset>
        <div className="flex h-svh min-h-0 flex-col">
          <header className="bg-background/80 flex items-center justify-between border-b px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <h1 className="text-base font-semibold">{active.title}</h1>
                <p className="text-muted-foreground hidden text-xs sm:block">
                  {active.subtitle}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatOpen((prev) => !prev)}
            >
              {chatOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
              {chatOpen ? "Collapse AI" : "Open AI"}
            </Button>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{active.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{active.subtitle}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="border p-3">
                        <p className="text-foreground text-xs font-medium uppercase">
                          Next action
                        </p>
                        <p className="mt-1">Continue setup and review recommendations.</p>
                      </div>
                      <div className="border p-3">
                        <p className="text-foreground text-xs font-medium uppercase">
                          System note
                        </p>
                        <p className="mt-1">No authentication enabled for this dashboard build.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Today</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between border p-2">
                      <span className="text-muted-foreground">Tasks</span>
                      <span className="font-medium">6</span>
                    </div>
                    <div className="flex items-center justify-between border p-2">
                      <span className="text-muted-foreground">Bookings</span>
                      <span className="font-medium">2 pending</span>
                    </div>
                    <div className="flex items-center justify-between border p-2">
                      <span className="text-muted-foreground">Budget status</span>
                      <span className="font-medium">On track</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <Button variant="outline" className="justify-start rounded-none">
                      <SparklesIcon /> Plan My Day
                    </Button>
                    <Button variant="outline" className="justify-start rounded-none">
                      <PlaneIcon /> Search Flights
                    </Button>
                    <Button variant="outline" className="justify-start rounded-none">
                      <HotelIcon /> Find Hotels
                    </Button>
                    <Button variant="outline" className="justify-start rounded-none">
                      <CompassIcon /> Explore Nearby
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            <aside
              className={cn(
                "bg-card border-l transition-[width] duration-200 ease-linear",
                chatOpen ? "w-full sm:w-[360px]" : "w-0"
              )}
            >
              <div
                className={cn(
                  "flex h-full min-h-0 flex-col overflow-hidden",
                  chatOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BotIcon className="size-4" />
                    <p className="text-sm font-medium">AI Copilot</p>
                  </div>
                  <Badge variant="secondary" className="rounded-none">
                    Beta
                  </Badge>
                </div>

                <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
                  <div className="bg-muted border p-3">
                    Try: <span className="font-medium">"Plan a low-cost day 2 route"</span>
                  </div>
                  <div className="border p-3">
                    I can help optimize flights, hotels, transit paths, and nearby attractions.
                  </div>
                  <div className="bg-primary text-primary-foreground ml-auto max-w-[90%] border p-3">
                    What should I prioritize for first-time travelers?
                  </div>
                  <div className="border p-3">
                    Start with visa and documents, then lock flights/hotel, then build transit-safe daily plans.
                  </div>
                </div>

                <div className="border-t p-3">
                  <div className="space-y-2">
                    <Input placeholder="Ask the trip assistant..." />
                    <Textarea
                      rows={3}
                      placeholder="Add context: budget, group size, priorities"
                    />
                    <Button className="w-full rounded-none">
                      <SendIcon /> Send
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
