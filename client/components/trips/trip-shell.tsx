"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOutIcon, PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react"

import { getTripNavItemsForTrip } from "@/components/trips/nav"
import { TripAiPanel } from "@/components/trips/trip-ai-panel"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { countryNameFromCode } from "@/lib/iso-countries"
import { getUserProfileFromSupabase } from "@/lib/supabase-profile"
import type { User } from "@supabase/supabase-js"
import type { Trip } from "@/lib/trips"
import { Brand, PresenceDot, TripCover } from "@/components/Shared"

const TripPageContext = React.createContext<Trip | null>(null)

export function useTripPage(): Trip | null {
  return React.useContext(TripPageContext)
}

const pageCopy: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: "Trip Overview",
    subtitle: "The real trip data, now staged in the calmer client workspace.",
  },
  flights: {
    title: "Flights",
    subtitle: "Manual flight details, synced to the trip record and visible across the workspace.",
  },
  "buses-trains": {
    title: "Buses & trains",
    subtitle: "Domestic rail and bus legs live beside flights instead of outside the plan.",
  },
  hotels: {
    title: "Hotels",
    subtitle: "Stays, areas, and notes, all anchored to the same trip canvas.",
  },
  itinerary: {
    title: "Itinerary",
    subtitle: "Structured day planning with transport-aware timeline data.",
  },
  transit: {
    title: "Transit",
    subtitle: "Saved routes and suggestions stay attached to the itinerary they support.",
  },
  finance: {
    title: "Finance",
    subtitle: "Budget tracking remains local-state driven in this migration pass.",
  },
  group: {
    title: "Group",
    subtitle: "Members, invite links, and roles now run from client with the existing Supabase logic.",
  },
  docs: {
    title: "Documents",
    subtitle: "Trip documents stay in Supabase storage while the client shell stays consistent.",
  },
  packing: {
    title: "Packing",
    subtitle: "Shared and personal checklists, still backed by the existing trip tables.",
  },
}

function getPageKey(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length <= 2) return "overview"
  return parts[2] || "overview"
}

function getTravelerPills(trip: Trip) {
  return Array.from({ length: Math.max(1, Math.min(trip.travelers, 4)) }).map((_, index) => ({
    id: `${trip.id}-traveler-${index + 1}`,
    initials: index === 0 ? "YO" : `T${index + 1}`,
    color: ["#E7D6C7", "#CFE0D6", "#D8D9EC", "#EAE3D0"][index] ?? "#ECEAE3",
    name: index === 0 ? "You" : `Traveler ${index + 1}`,
    active: index < 2,
  }))
}

function tagForTrip(id: string): string {
  const palette = ["tag-a", "tag-b", "tag-c", "tag-d", "tag-e"]
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palette[hash % palette.length] ?? "tag-c"
}

function seedForTrip(id: string): number {
  return ([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7) + 1
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
  const [residenceLabel, setResidenceLabel] = React.useState<string | null>(null)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  React.useEffect(() => {
    void getUserProfileFromSupabase().then((profile) => {
      const name = countryNameFromCode(profile?.country_code)
      setResidenceLabel(name)
    })
  }, [user?.id])

  const pageKey = getPageKey(pathname)
  const header = pageCopy[pageKey] || pageCopy.overview
  const people = getTravelerPills(trip)
  const pageDetails = [
    `destination=${trip.destination}`,
    `dates=${trip.startDate} to ${trip.endDate}`,
    `travelers=${trip.travelers}`,
    `status=${trip.status}`,
    residenceLabel ? `country_of_residence=${residenceLabel}` : "",
  ]
    .filter(Boolean)
    .join("; ")

  return (
    <TripPageContext.Provider value={trip}>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            gridTemplateColumns: "248px minmax(0, 1fr)",
            background: "var(--bg)",
          }}
        >
          <aside
            style={{
              background: "var(--panel)",
              borderRight: "1px solid var(--hair)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 14px 12px" }}>
              <Link href="/trips" style={{ display: "flex", alignItems: "center", gap: 8, color: "inherit" }}>
                <span style={{ color: "var(--ink-3)" }}>←</span>
                <Brand size={13} />
              </Link>
            </div>

            <div
              style={{
                margin: "0 10px",
                padding: "10px 12px",
                background: "var(--card)",
                boxShadow: "inset 0 0 0 1px var(--hair)",
                borderRadius: 10,
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 6, overflow: "hidden" }}>
                <TripCover tag={tagForTrip(trip.id)} seed={seedForTrip(trip.id)} compact />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{trip.destination}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {trip.startDate} → {trip.endDate}
                </div>
              </div>
              <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{trip.totalDays}d</span>
            </div>

            <div style={{ padding: "18px 10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
              {getTripNavItemsForTrip(trip).map((item) => {
                const href = `/trips/${trip.id}${item.hrefSuffix}`
                const active = pathname === href
                return (
                  <Link
                    key={item.key}
                    href={href}
                    prefetch={false}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "7px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      color: active ? "var(--ink)" : "var(--ink-2)",
                      background: active ? "var(--card)" : "transparent",
                      boxShadow: active ? "inset 0 0 0 1px var(--hair)" : "none",
                    }}
                  >
                    <item.icon size={14} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div style={{ marginTop: "auto", padding: "16px 14px", borderTop: "1px solid var(--hair)" }}>
              <div className="caps" style={{ marginBottom: 10 }}>With you</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {people.map((person) => (
                  <div
                    key={person.id}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px", fontSize: 13 }}
                  >
                    <div className="avatar sm" style={{ background: person.color }}>{person.initials}</div>
                    <span style={{ color: "var(--ink-2)" }}>{person.name}</span>
                    <span style={{ marginLeft: "auto" }}>
                      <PresenceDot active={person.active} />
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--hair)" }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {user?.email || "Not signed in"}
                </div>
                {residenceLabel ? (
                  <div style={{ marginTop: 2, fontSize: 11, color: "var(--ink-4)" }}>
                    Residence: {residenceLabel}
                  </div>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push("/")
                    router.refresh()
                  }}
                >
                  <LogOutIcon className="mr-1 size-3.5" />
                  Sign out
                </Button>
              </div>
            </div>
          </aside>

          <main style={{ minWidth: 0, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <header
              style={{
                height: 56,
                padding: "0 24px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                borderBottom: "1px solid var(--hair)",
                background: "var(--bg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span className="caps">{header.title}</span>
                  <span style={{ color: "var(--ink-4)" }}>/</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)" }}>{trip.destination}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                <Button variant="outline" size="sm" onClick={() => setChatOpen((open) => !open)}>
                  {chatOpen ? <PanelRightCloseIcon className="size-3.5" /> : <PanelRightOpenIcon className="size-3.5" />}
                  {chatOpen ? "Close AI" : "Open AI"}
                </Button>
              </div>
            </header>

            <div
              style={{
                padding: "18px 32px 14px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 24,
                borderBottom: "1px solid var(--hair)",
              }}
            >
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div className="caps">
                  {trip.travelScope === "domestic" ? "Domestic trip" : "International trip"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: 38,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    marginTop: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {header.title}
                  <span
                    style={{
                      fontStyle: "italic",
                      color: "var(--ink-3)",
                      fontSize: 24,
                      marginLeft: 12,
                    }}
                  >
                    {trip.startDate} → {trip.endDate}
                  </span>
                </div>
                <div style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13 }}>{header.subtitle}</div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, auto)",
                  columnGap: 28,
                  textAlign: "right",
                  flex: "0 0 auto",
                }}
              >
                <div>
                  <div className="caps" style={{ fontSize: 10 }}>Days</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 18, color: "var(--ink)", marginTop: 2 }}>{trip.totalDays}</div>
                </div>
                <div>
                  <div className="caps" style={{ fontSize: 10 }}>Travelers</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 18, color: "var(--ink)", marginTop: 2 }}>{trip.travelers}</div>
                </div>
                <div>
                  <div className="caps" style={{ fontSize: 10 }}>Planned</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 18, color: "var(--ink)", marginTop: 2 }}>
                    {trip.itineraryDaysPlanned}
                  </div>
                </div>
                <div>
                  <div className="caps" style={{ fontSize: 10 }}>Status</div>
                  <div style={{ fontFamily: "var(--f-mono)", fontSize: 18, color: "var(--ink)", marginTop: 2 }}>
                    {trip.status}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", minHeight: 0, flex: 1 }}>
              <section style={{ minWidth: 0, flex: 1, overflow: "auto", padding: "24px 32px 40px" }}>
                <div style={{ maxWidth: 1120 }}>{children}</div>
              </section>
              <TripAiPanel
                open={chatOpen}
                tripId={trip.id}
                pageKey={pageKey}
                pageContext={{
                  title: header.title,
                  subtitle: header.subtitle,
                  path: pathname,
                  details: pageDetails,
                }}
              />
            </div>
          </main>
        </div>
      </div>
    </TripPageContext.Provider>
  )
}
