"use client"

import * as React from "react"
import {
  CircleAlertIcon,
  LinkIcon,
  EyeIcon,
  PencilIcon,
  RouteIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { useUpdateTrip } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { TransitPlaceSearch } from "@/components/trips/transit-place-search"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Textarea,
} from "@/components/ui/textarea"
import {
  deleteTripTransitRouteFromSupabase,
  getTripTransitRoutesFromSupabase,
  saveTripTransitRouteToSupabase,
} from "@/lib/supabase-trip-transit"
import {
  getTripTravelScope,
  type TransitMode,
  type TransitRoute,
  type Trip,
} from "@/lib/trips"

// Routes are now loaded directly from Supabase in each view component,
// not from the in-memory trip store.

type TransitSuggestion = {
  summaryLabel: string
  durationMinutes: number
  estimatedCost: number | null
  currency: string
  transfers: number
  walkingMinutes: number
  departureTimeLocal?: string
  arrivalTimeLocal?: string
  providerRouteRef?: string
  mode: TransitMode
}

type SuggestResponse = {
  ok: boolean
  data?: TransitSuggestion[]
  error?: string
}

type ManualDraft = {
  dayIndex: number
  fromLabel: string
  toLabel: string
  mode: TransitMode
  durationMinutes: string
  departureTimeLocal: string
  arrivalTimeLocal: string
  estimatedCost: string
  currency: string
  transfers: string
  walkingMinutes: string
  notes: string
  referenceUrl: string
  provider: "google_maps" | "manual"
  providerRouteRef: string
}

type MapPreview = {
  fromLabel: string
  toLabel: string
  mode: TransitMode
  label: string
  providerRouteRef?: string
  departureTimeLocal?: string
  arrivalTimeLocal?: string
}

type TimeFilterMode = "depart" | "arrive"

const modeOptions: TransitMode[] = [
  "subway",
  "bus",
  "tram",
  "rail",
  "ferry",
  "walk_mix",
  "other",
]

const modeLabels: Record<TransitMode, string> = {
  subway: "Subway",
  bus: "Bus",
  tram: "Tram",
  rail: "Rail",
  ferry: "Ferry",
  walk_mix: "Walk + Transit",
  other: "Other",
}

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

function sortRoutes(routes: TransitRoute[]): TransitRoute[] {
  return [...routes].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
    const aTime = a.departureTimeLocal ?? ""
    const bTime = b.departureTimeLocal ?? ""
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    return a.createdAt.localeCompare(b.createdAt)
  })
}

function formatTime(value?: string): string {
  if (!value) return "Time TBD"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value.replace("T", " ")
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed)
}

function formatMoney(cost: number, currency: string): string {
  return `${currency} ${cost.toFixed(2)}`
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function buildDayWeekdayMap(startDate: string, totalDays: number): Record<number, string> {
  const start = parseLocalDate(startDate)
  const mapping: Record<number, string> = {}
  for (let i = 1; i <= totalDays; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + (i - 1))
    mapping[i] = weekdayNames[date.getDay()]
  }
  return mapping
}

function buildTripDayDateTime(
  startDate: string,
  dayIndex: number,
  hour: number,
  minute: number
): string {
  const date = parseLocalDate(startDate)
  date.setDate(date.getDate() + (dayIndex - 1))
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(hour).padStart(2, "0")
  const min = String(minute).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function applyDayToDateTime(
  value: string,
  startDate: string,
  dayIndex: number
): string {
  if (!value) return value
  const targetDate = parseLocalDate(startDate)
  targetDate.setDate(targetDate.getDate() + (dayIndex - 1))

  const parsed = new Date(value)
  const hours = Number.isNaN(parsed.getTime()) ? 9 : parsed.getHours()
  const minutes = Number.isNaN(parsed.getTime()) ? 0 : parsed.getMinutes()

  const yyyy = targetDate.getFullYear()
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0")
  const dd = String(targetDate.getDate()).padStart(2, "0")
  const hh = String(hours).padStart(2, "0")
  const min = String(minutes).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function buildEmptyDraft(): ManualDraft {
  return {
    dayIndex: 1,
    fromLabel: "",
    toLabel: "",
    mode: "rail",
    durationMinutes: "",
    departureTimeLocal: "",
    arrivalTimeLocal: "",
    estimatedCost: "",
    currency: "USD",
    transfers: "",
    walkingMinutes: "",
    notes: "",
    referenceUrl: "",
    provider: "manual",
    providerRouteRef: "",
  }
}

function buildDraftFromSuggestion(
  suggestion: TransitSuggestion,
  dayIndex: number,
  fromLabel: string,
  toLabel: string
): ManualDraft {
  return {
    dayIndex,
    fromLabel,
    toLabel,
    mode: suggestion.mode,
    durationMinutes: String(suggestion.durationMinutes),
    departureTimeLocal: suggestion.departureTimeLocal ?? "",
    arrivalTimeLocal: suggestion.arrivalTimeLocal ?? "",
    estimatedCost:
      suggestion.estimatedCost === null ? "" : String(suggestion.estimatedCost),
    currency: suggestion.currency || "USD",
    transfers: String(suggestion.transfers ?? 0),
    walkingMinutes: String(suggestion.walkingMinutes ?? 0),
    notes: suggestion.summaryLabel,
    referenceUrl: "",
    provider: "google_maps",
    providerRouteRef: suggestion.providerRouteRef ?? "",
  }
}

function parseRoutePairsFromText(text: string): Array<{ fromLabel: string; toLabel: string; referenceUrl?: string }> {
  const pairs: Array<{ fromLabel: string; toLabel: string; referenceUrl?: string }> = []
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  let pendingLink: string | undefined

  for (const line of lines) {
    const maybeUrl = line.match(/https?:\/\/\S+/i)?.[0]
    if (maybeUrl) {
      pendingLink = maybeUrl
    }

    const routeMatch =
      line.match(/^([A-Za-z][A-Za-z0-9 .()'&/-]+?)\s*(?:-|–|—|→)\s*([A-Za-z][A-Za-z0-9 .()'&/-]+)$/) ||
      line.match(/^([A-Za-z][A-Za-z0-9 .()'&/-]+?)\s*(?:-|–|—|→)\s*([A-Za-z][A-Za-z0-9 .()'&/-]+)\s*:/)

    if (routeMatch) {
      const fromLabel = routeMatch[1].trim()
      const toLabel = routeMatch[2].trim()
      if (fromLabel && toLabel && fromLabel.toLowerCase() !== toLabel.toLowerCase()) {
        pairs.push({ fromLabel, toLabel, referenceUrl: pendingLink })
        pendingLink = undefined
      }
    }
  }

  return pairs
}

function buildDirectionsUrl(
  fromLabel: string,
  toLabel: string,
  _departureTimeLocal?: string,
  _arrivalTimeLocal?: string
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: fromLabel,
    destination: toLabel,
    travelmode: "transit",
  })

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function buildEmbedMapUrl(preview: MapPreview | null): string | null {
  if (!preview?.fromLabel || !preview?.toLabel) return null
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
  if (!key) return null

  const params = new URLSearchParams({
    key,
    origin: preview.fromLabel,
    destination: preview.toLabel,
    mode: "transit",
  })

  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`
}

function buildStaticMapUrl(preview: MapPreview | null): string | null {
  if (!preview?.providerRouteRef) return null
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return null

  const params = new URLSearchParams({
    size: "900x520",
    key,
    path: `weight:5|color:0x1e88e5|enc:${preview.providerRouteRef}`,
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

export function TransitPageContent() {
  const trip = useTripPage()
  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }
  if (getTripTravelScope(trip) === "domestic") {
    return <DomesticTransitView trip={trip} />
  }
  return <TransitPageBody trip={trip} />
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Domestic Transit — lightweight "lines, fares & essentials" view
 * ─────────────────────────────────────────────────────────────────────────── */

type DomesticDraft = {
  dayIndex: number
  title: string
  mode: TransitMode
  fare: string
  currency: string
  notes: string
  referenceUrl: string
  fromLabel: string
  toLabel: string
}

function buildEmptyDomesticDraft(): DomesticDraft {
  return {
    dayIndex: 1,
    title: "",
    mode: "rail",
    fare: "",
    currency: "CAD",
    notes: "",
    referenceUrl: "",
    fromLabel: "",
    toLabel: "",
  }
}

function DomesticTransitView({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()

  const [routes, setRoutes] = React.useState<TransitRoute[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draft, setDraft] = React.useState<DomesticDraft>(buildEmptyDomesticDraft)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [showLeg, setShowLeg] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTripTransitRoutesFromSupabase(trip.id).then((rows) => {
      if (cancelled) return
      const sorted = sortRoutes(rows)
      setRoutes(sorted)
      updateTrip(trip.id, { transitRoutes: sorted, transitSaved: sorted.length > 0 })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [trip.id, updateTrip])

  const dayOptions = React.useMemo(
    () => Array.from({ length: trip.totalDays }, (_, idx) => idx + 1),
    [trip.totalDays]
  )
  const dayWeekdayMap = React.useMemo(
    () => buildDayWeekdayMap(trip.startDate, trip.totalDays),
    [trip.startDate, trip.totalDays]
  )

  const groupedRoutes = React.useMemo(() => {
    const grouped = new Map<number, TransitRoute[]>()
    for (const route of routes) {
      const existing = grouped.get(route.dayIndex) ?? []
      existing.push(route)
      grouped.set(route.dayIndex, existing)
    }
    return grouped
  }, [routes])

  function syncStore(next: TransitRoute[]) {
    setRoutes(next)
    updateTrip(trip.id, { transitRoutes: next, transitSaved: next.length > 0 })
  }

  async function handleSave() {
    const title = draft.title.trim()
    if (!title) { setError("Give this entry a title (line, route, or short description)."); return }
    if (draft.dayIndex < 1 || draft.dayIndex > trip.totalDays) { setError(`Day must be 1–${trip.totalDays}.`); return }
    const from = draft.fromLabel.trim()
    const to = draft.toLabel.trim()
    if ((from && !to) || (!from && to)) { setError("Fill in both From and To, or leave both empty."); return }
    if (from && to && from.toLowerCase() === to.toLowerCase()) { setError("From and To cannot be the same."); return }
    setError(null)

    const now = new Date().toISOString()
    const existing = editingId ? routes.find((r) => r.id === editingId) : undefined
    const fare = Number(draft.fare)

    const route: TransitRoute = {
      id: editingId ?? crypto.randomUUID(),
      tripId: trip.id,
      dayIndex: draft.dayIndex,
      fromLabel: from || title,
      toLabel: to || title,
      mode: draft.mode,
      durationMinutes: 0,
      estimatedCost: Number.isFinite(fare) && fare >= 0 ? fare : 0,
      currency: draft.currency.trim() || "CAD",
      provider: "manual",
      notes: [title, draft.notes.trim()].filter(Boolean).join(" · ") || undefined,
      referenceUrl: draft.referenceUrl.trim() || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    setSaving(true)
    try {
      await saveTripTransitRouteToSupabase(trip.id, route)
      const next = sortRoutes(
        editingId
          ? routes.map((r) => (r.id === editingId ? route : r))
          : [...routes, route],
      )
      syncStore(next)
      toast.success(editingId ? "Updated" : "Saved")
      setEditingId(null)
      setShowLeg(false)
      setDraft(buildEmptyDomesticDraft())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(route: TransitRoute) {
    setError(null)
    setEditingId(route.id)
    const titlePart = route.notes?.split(" · ")[0] ?? ""
    const notesPart = route.notes?.split(" · ").slice(1).join(" · ") ?? ""
    const hasLeg = route.fromLabel !== route.toLabel
    setShowLeg(hasLeg)
    setDraft({
      dayIndex: route.dayIndex,
      title: titlePart,
      mode: route.mode,
      fare: route.estimatedCost > 0 ? String(route.estimatedCost) : "",
      currency: route.currency || "CAD",
      notes: notesPart,
      referenceUrl: route.referenceUrl ?? "",
      fromLabel: hasLeg ? route.fromLabel : "",
      toLabel: hasLeg ? route.toLabel : "",
    })
  }

  async function handleDelete(id: string) {
    try {
      await deleteTripTransitRouteFromSupabase(trip.id, id)
      syncStore(routes.filter((r) => r.id !== id))
      toast.success("Removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  function handleCancel() {
    setEditingId(null)
    setError(null)
    setShowLeg(false)
    setDraft(buildEmptyDomesticDraft())
  }

  const field = (key: keyof DomesticDraft, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transit</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Jot down lines, fares, and tips you'll need on the go.
        </CardContent>
      </Card>

      {/* ── Add / Edit form ── */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit" : "Quick add"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon className="size-4" />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => field("title", e.target.value)}
                placeholder="Line 1 Yonge-University, GO Train to Hamilton…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select
                value={String(draft.dayIndex)}
                onValueChange={(v) => setDraft((p) => ({ ...p, dayIndex: Number(v) }))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((d) => (
                    <SelectItem key={d} value={String(d)}>Day {d} ({dayWeekdayMap[d]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select
                value={draft.mode}
                onValueChange={(v) => setDraft((p) => ({ ...p, mode: v as TransitMode }))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modeOptions.map((m) => (
                    <SelectItem key={m} value={m}>{modeLabels[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fare</Label>
              <Input type="number" min="0" step="0.01" value={draft.fare} onChange={(e) => field("fare", e.target.value)} placeholder="3.35" />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={draft.currency} onChange={(e) => field("currency", e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={draft.notes}
              onChange={(e) => field("notes", e.target.value)}
              placeholder="Buy a day pass at the kiosk, tap PRESTO card, etc."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Link (optional)</Label>
            <Input value={draft.referenceUrl} onChange={(e) => field("referenceUrl", e.target.value)} placeholder="https://..." />
          </div>

          {/* ── Optional leg detail ── */}
          {showLeg ? (
            <div className="space-y-3 rounded-md border border-dashed p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Leg detail (optional)</p>
                <Button variant="ghost" size="sm" onClick={() => { setShowLeg(false); setDraft((p) => ({ ...p, fromLabel: "", toLabel: "" })) }}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input value={draft.fromLabel} onChange={(e) => field("fromLabel", e.target.value)} placeholder="Union Station" />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input value={draft.toLabel} onChange={(e) => field("toLabel", e.target.value)} placeholder="Downtown" />
                </div>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowLeg(true)}>
              + Add From → To leg
            </Button>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Update" : "Save"}</Button>
            {editingId ? <Button variant="outline" onClick={handleCancel}>Cancel</Button> : null}
          </div>
        </CardContent>
      </Card>

      {/* ── Saved entries ── */}
      <Card>
        <CardHeader>
          <CardTitle>Saved</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet — add your first note above.</p>
          ) : (
            <div className="space-y-4">
              {Array.from(groupedRoutes.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([day, dayRoutes]) => (
                  <div key={day} className="space-y-2">
                    <h4 className="text-sm font-medium">Day {day} ({dayWeekdayMap[day]})</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {dayRoutes.map((route) => {
                        const titlePart = route.notes?.split(" · ")[0] ?? ""
                        const notesPart = route.notes?.split(" · ").slice(1).join(" · ") ?? ""
                        const hasLeg = route.fromLabel !== route.toLabel
                        return (
                          <div key={route.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm leading-snug">{titlePart || route.fromLabel}</p>
                              <Badge variant="outline" className="shrink-0 text-[10px]">{modeLabels[route.mode]}</Badge>
                            </div>
                            {hasLeg ? (
                              <p className="text-xs text-muted-foreground">{route.fromLabel} → {route.toLabel}</p>
                            ) : null}
                            {notesPart ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">{notesPart}</p>
                            ) : null}
                            {route.estimatedCost > 0 ? (
                              <p className="text-xs font-medium tabular-nums">{formatMoney(route.estimatedCost, route.currency)}</p>
                            ) : null}
                            {route.referenceUrl ? (
                              <a href={route.referenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline">
                                <LinkIcon className="size-3" /> Link
                              </a>
                            ) : null}
                            <div className="flex gap-1 pt-1">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(route)}>
                                <PencilIcon className="size-3" /> Edit
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => handleDelete(route.id)}>
                                <Trash2Icon className="size-3" /> Delete
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <RouteIcon className="size-4" />
            Transit status updates automatically from this list.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
 * International Transit — full planner with provider suggestions + map
 * ─────────────────────────────────────────────────────────────────────────── */

function TransitPageBody({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()

  const [routes, setRoutes] = React.useState<TransitRoute[]>([])
  const [routesLoaded, setRoutesLoaded] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    getTripTransitRoutesFromSupabase(trip.id).then((rows) => {
      if (cancelled) return
      const sorted = sortRoutes(rows)
      setRoutes(sorted)
      updateTrip(trip.id, { transitRoutes: sorted, transitSaved: sorted.length > 0 })
      setRoutesLoaded(true)
    })
    return () => { cancelled = true }
  }, [trip.id, updateTrip])

  const [dayIndex, setDayIndex] = React.useState<number>(1)
  const [fromLabel, setFromLabel] = React.useState("")
  const [toLabel, setToLabel] = React.useState("")
  const [timeFilterMode, setTimeFilterMode] = React.useState<TimeFilterMode>("depart")
  const [departureTime, setDepartureTime] = React.useState("")
  const [arrivalByTime, setArrivalByTime] = React.useState("")

  const [providerLoading, setProviderLoading] = React.useState(false)
  const [providerError, setProviderError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<TransitSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = React.useState<number>(0)

  const [manualDraft, setManualDraft] = React.useState<ManualDraft>(buildEmptyDraft())
  const [manualError, setManualError] = React.useState<string | null>(null)
  const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null)
  const [inputTab, setInputTab] = React.useState<"route" | "manual">("route")

  const [mapPreview, setMapPreview] = React.useState<MapPreview | null>(null)
  const [bulkText, setBulkText] = React.useState("")

  const dayOptions = React.useMemo(
    () => Array.from({ length: trip.totalDays }, (_, idx) => idx + 1),
    [trip.totalDays]
  )
  const dayWeekdayMap = React.useMemo(
    () => buildDayWeekdayMap(trip.startDate, trip.totalDays),
    [trip.startDate, trip.totalDays]
  )

  const mapEmbedUrl = React.useMemo(() => buildEmbedMapUrl(mapPreview), [mapPreview])
  const mapStaticUrl = React.useMemo(
    () => buildStaticMapUrl(mapPreview),
    [mapPreview]
  )

  React.useEffect(() => {
    if (!departureTime && !arrivalByTime) {
      if (timeFilterMode === "depart") {
        setDepartureTime(buildTripDayDateTime(trip.startDate, dayIndex, 9, 0))
      } else {
        setArrivalByTime(buildTripDayDateTime(trip.startDate, dayIndex, 9, 0))
      }
      return
    }
    if (departureTime) {
      setDepartureTime((prev) => applyDayToDateTime(prev, trip.startDate, dayIndex))
    }
    if (arrivalByTime) {
      setArrivalByTime((prev) => applyDayToDateTime(prev, trip.startDate, dayIndex))
    }
  }, [arrivalByTime, dayIndex, departureTime, timeFilterMode, trip.startDate])

  React.useEffect(() => {
    setManualDraft((prev) => {
      const nextDeparture = applyDayToDateTime(
        prev.departureTimeLocal,
        trip.startDate,
        prev.dayIndex
      )
      const nextArrival = applyDayToDateTime(
        prev.arrivalTimeLocal,
        trip.startDate,
        prev.dayIndex
      )
      if (
        nextDeparture === prev.departureTimeLocal &&
        nextArrival === prev.arrivalTimeLocal
      ) {
        return prev
      }
      return {
        ...prev,
        departureTimeLocal: nextDeparture,
        arrivalTimeLocal: nextArrival,
      }
    })
  }, [trip.startDate, manualDraft.dayIndex])

  function syncManualFromLookup() {
    setManualDraft((prev) => ({
      ...prev,
      dayIndex,
      fromLabel,
      toLabel,
      departureTimeLocal: departureTime,
      arrivalTimeLocal: arrivalByTime,
      provider: "manual",
      providerRouteRef: "",
    }))
    setMapPreview({
      fromLabel,
      toLabel,
      mode: "walk_mix",
      label: `${fromLabel} → ${toLabel}`,
      providerRouteRef: "",
      departureTimeLocal: timeFilterMode === "depart" ? departureTime || undefined : undefined,
      arrivalTimeLocal: timeFilterMode === "arrive" ? arrivalByTime || undefined : undefined,
    })
  }

  function syncStore(next: TransitRoute[]) {
    const sorted = sortRoutes(next)
    setRoutes(sorted)
    updateTrip(trip.id, { transitRoutes: sorted, transitSaved: sorted.length > 0 })
  }

  async function handleFindSuggestions() {
    const origin = fromLabel.trim()
    const destination = toLabel.trim()

    setManualError(null)
    setProviderError(null)

    if (!origin || !destination) {
      setProviderError("Enter both origin and destination.")
      return
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      setProviderError("Origin and destination must be different.")
      return
    }

    let departureTimeParam =
      timeFilterMode === "depart" ? departureTime || undefined : undefined
    let arrivalTimeParam =
      timeFilterMode === "arrive" ? arrivalByTime || undefined : undefined

    if (!departureTimeParam && !arrivalTimeParam) {
      const fallback = buildTripDayDateTime(trip.startDate, dayIndex, 9, 0)
      departureTimeParam = fallback
      setDepartureTime(fallback)
      setArrivalByTime("")
      setTimeFilterMode("depart")
    }

    syncManualFromLookup()
    setProviderLoading(true)

    try {
      const res = await fetch("/api/transit/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          day_index: dayIndex,
          departure_time: departureTimeParam,
          arrival_time: arrivalTimeParam,
        }),
      })

      const payload = (await res.json()) as SuggestResponse

      if (!res.ok || !payload.ok) {
        setSuggestions([])
        setProviderError(
          payload.error || "Transit provider is unavailable. Use manual save below."
        )
        return
      }

      const nextOptions = (payload.data ?? []).slice(0, 3)
      setSuggestions(nextOptions)
      setSelectedSuggestion(0)

      if (nextOptions.length === 0) {
        setProviderError("No alternatives found. You can still save this leg manually.")
      } else {
        const first = nextOptions[0]
        setProviderError(null)
        setMapPreview({
          fromLabel: origin,
          toLabel: destination,
          mode: first.mode,
          label: first.summaryLabel,
          providerRouteRef: first.providerRouteRef,
          departureTimeLocal: first.departureTimeLocal ?? departureTimeParam,
          arrivalTimeLocal: first.arrivalTimeLocal ?? arrivalTimeParam,
        })
      }
    } catch {
      setSuggestions([])
      setProviderError(
        "Transit lookup failed. You can continue with manual save for this route."
      )
    } finally {
      setProviderLoading(false)
    }
  }

  function handleUseSuggestionForManual(index: number) {
    const option = suggestions[index]
    if (!option) return
    setSelectedSuggestion(index)
    setManualDraft(buildDraftFromSuggestion(option, dayIndex, fromLabel, toLabel))
    setMapPreview({
      fromLabel,
      toLabel,
      mode: option.mode,
      label: option.summaryLabel,
      providerRouteRef: option.providerRouteRef,
      departureTimeLocal: option.departureTimeLocal,
      arrivalTimeLocal: option.arrivalTimeLocal,
    })
  }

  function validateManualDraft(draft: ManualDraft): string | null {
    if (!draft.fromLabel.trim() || !draft.toLabel.trim()) {
      return "From and To are required."
    }
    if (draft.fromLabel.trim().toLowerCase() === draft.toLabel.trim().toLowerCase()) {
      return "From and To cannot be the same location."
    }
    if (draft.dayIndex < 1 || draft.dayIndex > trip.totalDays) {
      return `Day must be between 1 and ${trip.totalDays}.`
    }
    const duration = Number(draft.durationMinutes)
    if (!Number.isFinite(duration) || duration <= 0) {
      return "Duration must be greater than 0."
    }
    const cost = Number(draft.estimatedCost)
    if (!Number.isFinite(cost) || cost < 0) {
      return "Estimated cost must be 0 or higher."
    }
    if (draft.departureTimeLocal && draft.arrivalTimeLocal) {
      const departureDate = new Date(draft.departureTimeLocal)
      const arrivalDate = new Date(draft.arrivalTimeLocal)
      if (
        !Number.isNaN(departureDate.getTime()) &&
        !Number.isNaN(arrivalDate.getTime()) &&
        arrivalDate.getTime() < departureDate.getTime()
      ) {
        return "Arrival time cannot be earlier than departure time."
      }
    }
    return null
  }

  async function handleSaveManual() {
    const error = validateManualDraft(manualDraft)
    if (error) {
      setManualError(error)
      return
    }

    setManualError(null)
    const now = new Date().toISOString()
    const existingRoute = editingRouteId
      ? routes.find((route) => route.id === editingRouteId)
      : undefined

    const normalizedRoute: TransitRoute = {
      id: editingRouteId ?? crypto.randomUUID(),
      tripId: trip.id,
      dayIndex: manualDraft.dayIndex,
      fromLabel: manualDraft.fromLabel.trim(),
      toLabel: manualDraft.toLabel.trim(),
      mode: manualDraft.mode,
      durationMinutes: Number(manualDraft.durationMinutes),
      departureTimeLocal: manualDraft.departureTimeLocal || undefined,
      arrivalTimeLocal: manualDraft.arrivalTimeLocal || undefined,
      estimatedCost: Number(manualDraft.estimatedCost),
      currency: manualDraft.currency.trim() || "USD",
      provider: manualDraft.provider,
      providerRouteRef: manualDraft.providerRouteRef || undefined,
      referenceUrl: manualDraft.referenceUrl.trim() || undefined,
      transfers: manualDraft.transfers ? Number(manualDraft.transfers) : undefined,
      walkingMinutes: manualDraft.walkingMinutes
        ? Number(manualDraft.walkingMinutes)
        : undefined,
      notes: manualDraft.notes.trim() || undefined,
      createdAt: existingRoute?.createdAt || now,
      updatedAt: now,
    }

    try {
      await saveTripTransitRouteToSupabase(trip.id, normalizedRoute)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save route")
      return
    }

    const nextRoutes = editingRouteId
      ? routes.map((route) =>
          route.id === editingRouteId ? normalizedRoute : route
        )
      : [...routes, normalizedRoute]

    syncStore(nextRoutes)
    toast.success(editingRouteId ? "Transit route updated" : "Transit route saved")

    setMapPreview({
      fromLabel: normalizedRoute.fromLabel,
      toLabel: normalizedRoute.toLabel,
      mode: normalizedRoute.mode,
      label: `${normalizedRoute.fromLabel} → ${normalizedRoute.toLabel}`,
      providerRouteRef: normalizedRoute.providerRouteRef,
      departureTimeLocal: normalizedRoute.departureTimeLocal,
      arrivalTimeLocal: normalizedRoute.arrivalTimeLocal,
    })

    setEditingRouteId(null)
    setManualDraft(buildEmptyDraft())
    setSuggestions([])
    setProviderError(null)
    setFromLabel("")
    setToLabel("")
    setDepartureTime("")
    setArrivalByTime("")
  }

  async function handleSaveSelectedSuggestion() {
    const selected = suggestions[selectedSuggestion]
    if (!selected) return

    const draft = buildDraftFromSuggestion(selected, dayIndex, fromLabel, toLabel)

    const immediateRoute: TransitRoute = {
      id: crypto.randomUUID(),
      tripId: trip.id,
      dayIndex: draft.dayIndex,
      fromLabel: draft.fromLabel,
      toLabel: draft.toLabel,
      mode: draft.mode,
      durationMinutes: Number(draft.durationMinutes),
      departureTimeLocal: draft.departureTimeLocal || undefined,
      arrivalTimeLocal: draft.arrivalTimeLocal || undefined,
      estimatedCost: draft.estimatedCost === "" ? 0 : Number(draft.estimatedCost),
      currency: draft.currency,
      provider: "google_maps",
      providerRouteRef: draft.providerRouteRef || undefined,
      referenceUrl: draft.referenceUrl.trim() || undefined,
      transfers: draft.transfers ? Number(draft.transfers) : undefined,
      walkingMinutes: draft.walkingMinutes ? Number(draft.walkingMinutes) : undefined,
      notes: draft.notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      await saveTripTransitRouteToSupabase(trip.id, immediateRoute)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save route")
      return
    }

    syncStore([...routes, immediateRoute])
    toast.success("Transit route saved")
    setMapPreview({
      fromLabel: immediateRoute.fromLabel,
      toLabel: immediateRoute.toLabel,
      mode: immediateRoute.mode,
      label: selected.summaryLabel,
      providerRouteRef: immediateRoute.providerRouteRef,
      departureTimeLocal: immediateRoute.departureTimeLocal,
      arrivalTimeLocal: immediateRoute.arrivalTimeLocal,
    })
  }

  function handleEditRoute(route: TransitRoute) {
    setInputTab("manual")
    setEditingRouteId(route.id)
    setManualError(null)
    setManualDraft({
      dayIndex: route.dayIndex,
      fromLabel: route.fromLabel,
      toLabel: route.toLabel,
      mode: route.mode,
      durationMinutes: String(route.durationMinutes),
      departureTimeLocal: route.departureTimeLocal ?? "",
      arrivalTimeLocal: route.arrivalTimeLocal ?? "",
      estimatedCost: String(route.estimatedCost),
      currency: route.currency,
      transfers:
        typeof route.transfers === "number" ? String(route.transfers) : "",
      walkingMinutes:
        typeof route.walkingMinutes === "number"
          ? String(route.walkingMinutes)
          : "",
      notes: route.notes ?? "",
      referenceUrl: route.referenceUrl ?? "",
      provider: route.provider,
      providerRouteRef: route.providerRouteRef ?? "",
    })
    setMapPreview({
      fromLabel: route.fromLabel,
      toLabel: route.toLabel,
      mode: route.mode,
      label: `${route.fromLabel} → ${route.toLabel}`,
      providerRouteRef: route.providerRouteRef,
      departureTimeLocal: route.departureTimeLocal,
      arrivalTimeLocal: route.arrivalTimeLocal,
    })
  }

  async function handleDeleteRoute(routeId: string) {
    try {
      await deleteTripTransitRouteFromSupabase(trip.id, routeId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete route")
      return
    }
    const nextRoutes = routes.filter((route) => route.id !== routeId)
    syncStore(nextRoutes)
    toast.success("Transit route deleted")
    setMapPreview((prev) => {
      if (!prev) return prev
      const deleted = routes.find((route) => route.id === routeId)
      if (!deleted) return prev
      if (prev.fromLabel === deleted.fromLabel && prev.toLabel === deleted.toLabel) {
        return null
      }
      return prev
    })
  }

  async function handleImportFromText() {
    const parsed = parseRoutePairsFromText(bulkText)
    if (parsed.length === 0) {
      toast.error("No route pairs found. Use lines like Berlin - Dresden.")
      return
    }

    const now = new Date().toISOString()
    const importedRoutes: TransitRoute[] = parsed.map((entry, idx) => ({
      id: crypto.randomUUID(),
      tripId: trip.id,
      dayIndex,
      fromLabel: entry.fromLabel,
      toLabel: entry.toLabel,
      mode: "other" as TransitMode,
      durationMinutes: 60,
      departureTimeLocal: undefined,
      arrivalTimeLocal: undefined,
      estimatedCost: 0,
      currency: "USD",
      provider: "manual" as const,
      providerRouteRef: undefined,
      referenceUrl: entry.referenceUrl,
      transfers: undefined,
      walkingMinutes: undefined,
      notes: `Imported from notes (${idx + 1})`,
      createdAt: now,
      updatedAt: now,
    }))

    try {
      await Promise.all(
        importedRoutes.map((r) => saveTripTransitRouteToSupabase(trip.id, r)),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import routes")
      return
    }

    syncStore([...routes, ...importedRoutes])
    toast.success(`Imported ${importedRoutes.length} transit route(s)`)
    setBulkText("")
  }

  const groupedRoutes = React.useMemo(() => {
    const grouped = new Map<number, TransitRoute[]>()
    for (const route of routes) {
      const existing = grouped.get(route.dayIndex) ?? []
      existing.push(route)
      grouped.set(route.dayIndex, existing)
    }
    return grouped
  }, [routes])

  const externalMapUrl = mapPreview
    ? (mapEmbedUrl ||
      buildDirectionsUrl(
        mapPreview.fromLabel,
        mapPreview.toLabel,
        mapPreview.departureTimeLocal,
        mapPreview.arrivalTimeLocal
      ))
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transit Planner</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Save day-linked A→B transit legs, compare quick options, and keep a route map visible while you confirm details.
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={inputTab} onValueChange={(value) => setInputTab(value as "route" | "manual")}>
                <TabsList variant="line" className="w-full">
                  <TabsTrigger value="route">Enter Route</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {inputTab === "route" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Enter Route</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Day</Label>
                  <Select value={String(dayIndex)} onValueChange={(value) => setDayIndex(Number(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          Day {day} ({dayWeekdayMap[day]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>From</Label>
                  <TransitPlaceSearch
                    value={fromLabel}
                    onChange={setFromLabel}
                    placeholder="Point A"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                  <Label>To</Label>
                  <TransitPlaceSearch
                    value={toLabel}
                    onChange={setToLabel}
                    placeholder="Point B"
                  />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Time filter</Label>
                  <Select
                    value={timeFilterMode}
                    onValueChange={(value) => setTimeFilterMode(value as TimeFilterMode)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="depart">Leave at</SelectItem>
                      <SelectItem value="arrive">Arrive by</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {timeFilterMode === "depart"
                      ? "Departure time (optional)"
                      : "Arrival by (optional)"}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={timeFilterMode === "depart" ? departureTime : arrivalByTime}
                    onChange={(event) => {
                      if (timeFilterMode === "depart") {
                        setDepartureTime(event.target.value)
                        if (event.target.value) setArrivalByTime("")
                      } else {
                        setArrivalByTime(event.target.value)
                        if (event.target.value) setDepartureTime("")
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = buildTripDayDateTime(trip.startDate, dayIndex, 8, 0)
                    if (timeFilterMode === "depart") setDepartureTime(value)
                    else setArrivalByTime(value)
                  }}
                >
                  Morning
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = buildTripDayDateTime(trip.startDate, dayIndex, 13, 0)
                    if (timeFilterMode === "depart") setDepartureTime(value)
                    else setArrivalByTime(value)
                  }}
                >
                  Midday
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const value = buildTripDayDateTime(trip.startDate, dayIndex, 18, 0)
                    if (timeFilterMode === "depart") setDepartureTime(value)
                    else setArrivalByTime(value)
                  }}
                >
                  Evening
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                If no time is set, search uses 9:00 AM on the selected trip day (not “leave now”).
              </p>

              <div className="flex justify-end">
                <Button onClick={handleFindSuggestions} disabled={providerLoading}>
                  {providerLoading ? "Finding options..." : "Find Transit Options"}
                </Button>
              </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Pick Suggestion or Continue Manually</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
              {providerError ? (
                <Alert variant="destructive">
                  <CircleAlertIcon className="size-4" />
                  <AlertTitle>Provider lookup issue</AlertTitle>
                  <AlertDescription>{providerError}</AlertDescription>
                </Alert>
              ) : null}

              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.map((option, idx) => (
                    <button
                      type="button"
                      key={`${option.summaryLabel}-${idx}`}
                      className={`w-full border px-3 py-2 text-left text-xs ${selectedSuggestion === idx ? "border-primary" : "border-border"}`}
                      onClick={() => handleUseSuggestionForManual(idx)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{option.summaryLabel}</p>
                        <Badge variant="outline">{modeLabels[option.mode]}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {option.durationMinutes} min • {option.transfers} transfer(s) • {option.walkingMinutes} min walk
                      </p>
                      <p className="text-muted-foreground">
                        {option.estimatedCost === null ? "Fare unavailable" : formatMoney(option.estimatedCost, option.currency)}
                        {" • "}
                        {formatTime(option.departureTimeLocal)} → {formatTime(option.arrivalTimeLocal)}
                      </p>
                    </button>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button onClick={handleSaveSelectedSuggestion}>Save selected route</Button>
                    <Button variant="outline" onClick={() => {
                      setInputTab("manual")
                      syncManualFromLookup()
                      setManualError(null)
                    }}>
                      Use manual entry instead
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No suggestion chosen yet. Run a lookup or continue with manual save in step 3.
                </p>
              )}
                </CardContent>
              </Card>
            </>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Route Map Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mapPreview ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {mapPreview.label} • {modeLabels[mapPreview.mode]}
                  </p>
                  {mapStaticUrl ? (
                    <img
                      src={mapStaticUrl}
                      alt="Transit route preview"
                      className="h-[460px] w-full border object-cover"
                    />
                  ) : mapEmbedUrl ? (
                    <iframe
                      title="Transit route map"
                      src={mapEmbedUrl}
                      loading="lazy"
                      className="h-[460px] w-full border"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <Alert>
                      <CircleAlertIcon className="size-4" />
                      <AlertTitle>Map key missing</AlertTitle>
                      <AlertDescription>
                        Set <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY</code> for embed or static map preview.
                      </AlertDescription>
                    </Alert>
                  )}

                  {externalMapUrl ? (
                    <Button asChild className="w-full" variant="outline">
                      <a href={externalMapUrl} target="_blank" rel="noreferrer">
                        Open live route in Google Maps
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a suggestion or saved route to preview the map.
                </p>
              )}
            </CardContent>
          </Card>

          {inputTab === "manual" ? (
            <Card>
              <CardHeader>
                <CardTitle>{editingRouteId ? "Step 3: Edit Saved Route" : "Step 3: Manual Save"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
              {manualError ? (
                <Alert variant="destructive">
                  <CircleAlertIcon className="size-4" />
                  <AlertTitle>Cannot save route</AlertTitle>
                  <AlertDescription>{manualError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Day</Label>
                  <Select
                    value={String(manualDraft.dayIndex)}
                    onValueChange={(value) =>
                      setManualDraft((prev) => ({ ...prev, dayIndex: Number(value) }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          Day {day} ({dayWeekdayMap[day]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                  <Label>From</Label>
                  <TransitPlaceSearch
                    value={manualDraft.fromLabel}
                    onChange={(value) =>
                      setManualDraft((prev) => ({ ...prev, fromLabel: value }))
                    }
                    placeholder="Point A"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-1">
                  <Label>To</Label>
                  <TransitPlaceSearch
                    value={manualDraft.toLabel}
                    onChange={(value) =>
                      setManualDraft((prev) => ({ ...prev, toLabel: value }))
                    }
                    placeholder="Point B"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Mode</Label>
                  <Select
                    value={manualDraft.mode}
                    onValueChange={(value) =>
                      setManualDraft((prev) => ({ ...prev, mode: value as TransitMode }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modeOptions.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {modeLabels[mode]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" min="1" value={manualDraft.durationMinutes} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))
                  } />
                </div>
                <div className="space-y-1.5">
                  <Label>Estimated cost</Label>
                  <Input type="number" min="0" step="0.01" value={manualDraft.estimatedCost} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, estimatedCost: event.target.value }))
                  } />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input value={manualDraft.currency} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                  } />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Departure time</Label>
                  <Input type="datetime-local" value={manualDraft.departureTimeLocal} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, departureTimeLocal: event.target.value }))
                  } />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrival time</Label>
                  <Input type="datetime-local" value={manualDraft.arrivalTimeLocal} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, arrivalTimeLocal: event.target.value }))
                  } />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Transfers (optional)</Label>
                  <Input type="number" min="0" value={manualDraft.transfers} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, transfers: event.target.value }))
                  } />
                </div>
                <div className="space-y-1.5">
                  <Label>Walking minutes (optional)</Label>
                  <Input type="number" min="0" value={manualDraft.walkingMinutes} onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, walkingMinutes: event.target.value }))
                  } />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Reference link (optional)</Label>
                <Input
                  value={manualDraft.referenceUrl}
                  onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, referenceUrl: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={manualDraft.notes}
                  onChange={(event) =>
                    setManualDraft((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Stop details, station exits, payment notes"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveManual}>
                  {editingRouteId ? "Update route" : "Save route"}
                </Button>
                {editingRouteId ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingRouteId(null)
                      setManualError(null)
                      setManualDraft(buildEmptyDraft())
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Routes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 border p-3">
                <Label>Import route options from notes (optional)</Label>
                <Textarea
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                  placeholder="Paste text like: BERLIN - DRESDEN"
                />
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleImportFromText}>
                    Import from pasted text
                  </Button>
                </div>
              </div>

              {!routesLoaded ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : routes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved transit routes yet.</p>
              ) : (
                <div className="space-y-3">
                  {Array.from(groupedRoutes.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([day, dayRoutes]) => (
                      <div key={day} className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Day {day} ({dayWeekdayMap[day]})
                        </h4>
                        <div className="grid gap-2">
                          {dayRoutes.map((route) => (
                            <div key={route.id} className="border p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">
                                    {route.fromLabel} → {route.toLabel}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTime(route.departureTimeLocal)} → {formatTime(route.arrivalTimeLocal)}
                                  </p>
                                </div>
                                <Badge variant={route.provider === "google_maps" ? "secondary" : "outline"}>
                                  {route.provider === "google_maps" ? "Google Maps" : "Manual"}
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{modeLabels[route.mode]}</span>
                                <span>{route.durationMinutes} min</span>
                                <span>{formatMoney(route.estimatedCost, route.currency)}</span>
                                <span>Transfers: {route.transfers ?? 0}</span>
                              </div>
                              {route.referenceUrl ? (
                                <a
                                  href={route.referenceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground underline"
                                >
                                  <LinkIcon className="size-3" /> Source
                                </a>
                              ) : null}
                              <div className="mt-3 grid grid-cols-3 gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setMapPreview({
                                      fromLabel: route.fromLabel,
                                      toLabel: route.toLabel,
                                      mode: route.mode,
                                      label: `${route.fromLabel} → ${route.toLabel}`,
                                      providerRouteRef: route.providerRouteRef,
                                      departureTimeLocal: route.departureTimeLocal,
                                      arrivalTimeLocal: route.arrivalTimeLocal,
                                    })
                                  }
                                >
                                  <EyeIcon /> Preview
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRoute(route)}
                                >
                                  <PencilIcon /> Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRoute(route.id)}
                                >
                                  <Trash2Icon /> Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <RouteIcon className="size-4" />
                Transit saved state updates automatically from this list.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>1. Enter Day, Point A, and Point B.</p>
              <p>2. Fetch options and pick the best route.</p>
              <p>3. Save directly, or adjust details in manual mode.</p>
              <p>4. Use Preview to verify each saved route visually.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
