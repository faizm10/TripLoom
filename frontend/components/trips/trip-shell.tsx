"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOutIcon, PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react"

import { tripNavItems } from "@/components/trips/nav"
import { TripAiPanel } from "@/components/trips/trip-ai-panel"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Trip } from "@/lib/trips"

const TripPageContext = React.createContext<Trip | null>(null)

export function useTripPage(): Trip | null {
  return React.useContext(TripPageContext)
}

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: "Trip Overview",
    subtitle: "Your control center with next step, checklist, and live trip updates.",
  },
  flights: {
    title: "Flights",
    subtitle: "Search, compare, and confirm flight options with clear tradeoffs.",
  },
  hotels: {
    title: "Hotels",
    subtitle: "Find the right area and room, then book with confidence.",
  },
  itinerary: {
    title: "Itinerary",
    subtitle: "Plan your days in timeline mode or map mode without context switching.",
  },
  transit: {
    title: "Transit",
    subtitle: "Build route chains between itinerary points and save reusable paths.",
  },
  finance: {
    title: "Finance",
    subtitle: "Track totals, per-person splits, and day-by-day budget movement.",
  },
  group: {
    title: "Group",
    subtitle: "Manage members, roles, approvals, and split rules in one place.",
  },
  docs: {
    title: "Documents",
    subtitle: "Keep tickets and confirmations together for quick access.",
  },
}

function getPageKey(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length <= 2) return "overview"
  return parts[2] || "overview"
}

export function TripShell({
  trip,
  children,
}: {
  trip: Trip
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [chatOpen, setChatOpen] = React.useState(false)

  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const pageKey = getPageKey(pathname)
  const header = pageCopy[pageKey] || pageCopy.overview

  return (
    <TripPageContext.Provider value={trip}>
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 border px-2 py-2">
            <span className="bg-primary text-primary-foreground inline-flex size-6 items-center justify-center text-xs font-bold">
              TL
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">TripLoom</p>
              <p className="text-muted-foreground truncate text-[11px]">{trip.destination}</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Trip Control Center</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tripNavItems.map((item) => {
                  const href = `/trips/${trip.id}${item.hrefSuffix}`
                  const active = pathname === href
                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="space-y-2">
            <div className="border p-2 text-xs">
              <div className="flex items-center gap-2">
                <Avatar className="size-7 rounded-none">
                  <AvatarFallback className="rounded-none text-[10px]">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{user?.user_metadata?.name || "Traveler"}</p>
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full rounded-none"
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push("/")
                  router.refresh()
                }}
              >
                <LogOutIcon className="size-3.5 mr-2" />
                Sign out
              </Button>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full rounded-none">
              <Link href="/dashboard">Back to All Trips</Link>
            </Button>
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
                <h1 className="text-base font-semibold">{header.title}</h1>
                <p className="text-muted-foreground hidden text-xs sm:block">{header.subtitle}</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setChatOpen((v) => !v)}>
              {chatOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
              {chatOpen ? "Collapse AI" : "Open AI"}
            </Button>
          </header>

          <div className="flex min-h-0 flex-1">
            <section className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">{children}</section>
            <TripAiPanel open={chatOpen} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </TripPageContext.Provider>
  )
}
