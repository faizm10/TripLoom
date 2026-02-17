"use client"

import * as React from "react"
import {
  addMinutes,
  differenceInCalendarDays,
  format,
  getDay,
  parse,
  startOfWeek,
} from "date-fns"
import { enUS } from "date-fns/locale"
import { CalendarDaysIcon, ExternalLinkIcon, LinkIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useTripItineraryActions } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { buildGoogleExportBatch } from "@/lib/calendar-export"
import type {
  ItineraryCategory,
  ItineraryStatus,
  ItineraryTimeBlock,
  Trip,
  TripItineraryItem,
} from "@/lib/trips"
import {
  defaultBlockWindow,
  getDateRangeLabel,
  getTripItineraryItems,
  getTripTimezone,
  normalizeSortOrder,
  resolveItineraryEndLocal,
  resolveItineraryStartLocal,
  validateItineraryItemDraft,
} from "@/lib/trips"
import {
  Calendar,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
  type View,
} from "react-big-calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"

type StatusFilter = "all" | ItineraryStatus
type CalendarViewFilter = "month" | "week" | "day" | "agenda"

type ItineraryDraft = {
  title: string
  locationLabel: string
  dayIndex: number
  timeBlock: ItineraryTimeBlock
  status: ItineraryStatus
  category: ItineraryCategory
  notes: string
  commuteDetails: string
  locationLink: string
  googleMapsLink: string
  startTimeLocal: string
  endTimeLocal: string
}

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  resource: TripItineraryItem
}

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

const STATUS_OPTIONS: Array<{ key: ItineraryStatus; label: string }> = [
  { key: "planned", label: "Planned" },
  { key: "todo", label: "To Do" },
  { key: "finished", label: "Finished" },
]

const TIME_BLOCKS: Array<{ key: ItineraryTimeBlock; label: string }> = [
  { key: "morning", label: "Start Of Day" },
  { key: "afternoon", label: "Midday Focus" },
  { key: "evening", label: "Evening Wind-Down" },
]

const CATEGORY_OPTIONS: Array<{ key: ItineraryCategory; label: string; className: string }> = [
  { key: "outbound_flight", label: "Outbound Flight", className: "bg-blue-100 text-blue-900" },
  { key: "inbound_flight", label: "Inbound Flight", className: "bg-cyan-100 text-cyan-900" },
  { key: "commute", label: "Commute", className: "bg-sky-100 text-sky-900" },
  { key: "activities", label: "Activities", className: "bg-emerald-100 text-emerald-900" },
  { key: "games", label: "Games", className: "bg-violet-100 text-violet-900" },
  { key: "food", label: "Food", className: "bg-amber-100 text-amber-900" },
  { key: "sightseeing", label: "Sightseeing", className: "bg-rose-100 text-rose-900" },
  { key: "shopping", label: "Shopping", className: "bg-fuchsia-100 text-fuchsia-900" },
  { key: "rest", label: "Rest", className: "bg-slate-100 text-slate-900" },
  { key: "other", label: "Other", className: "bg-zinc-100 text-zinc-900" },
]

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `it-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function timeBlockFromDate(date: Date): ItineraryTimeBlock {
  const hour = date.getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

function dateFromLocalString(value?: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function localInputValueFromDate(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function dateForTripDay(startDate: string, dayIndex: number): Date {
  const [year, month, day] = startDate.split("-").map((value) => Number(value))
  const date = new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0)
  date.setDate(date.getDate() + Math.max(0, dayIndex - 1))
  return date
}

function inferDayIndexFromDate(date: Date, trip: Trip): number {
  const start = dateForTripDay(trip.startDate, 1)
  const diff = differenceInCalendarDays(date, start) + 1
  return Math.min(Math.max(1, diff), Math.max(1, trip.totalDays))
}

function buildDefaultTimes(trip: Trip, dayIndex: number, timeBlock: ItineraryTimeBlock): {
  startTimeLocal: string
  endTimeLocal: string
} {
  const dayDate = dateForTripDay(trip.startDate, dayIndex)
  const block = defaultBlockWindow(timeBlock)
  const start = new Date(dayDate)
  start.setHours(block.startHour, block.startMinute, 0, 0)
  const end = new Date(dayDate)
  end.setHours(block.endHour, block.endMinute, 0, 0)
  return {
    startTimeLocal: localInputValueFromDate(start),
    endTimeLocal: localInputValueFromDate(end),
  }
}

function emptyDraft(trip: Trip, dayIndex = 1, timeBlock: ItineraryTimeBlock = "morning"): ItineraryDraft {
  const defaults = buildDefaultTimes(trip, dayIndex, timeBlock)
  return {
    title: "",
    locationLabel: "",
    dayIndex,
    timeBlock,
    status: "planned",
    category: "activities",
    notes: "",
    commuteDetails: "",
    locationLink: "",
    googleMapsLink: "",
    startTimeLocal: defaults.startTimeLocal,
    endTimeLocal: defaults.endTimeLocal,
  }
}

function categoryClass(category: ItineraryCategory): string {
  return CATEGORY_OPTIONS.find((option) => option.key === category)?.className ?? "bg-zinc-100 text-zinc-900"
}

function normalizeForCompare(items: TripItineraryItem[]): string {
  return JSON.stringify(
    items
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => ({
        id: item.id,
        dayIndex: item.dayIndex,
        timeBlock: item.timeBlock,
        status: item.status,
        category: item.category,
        title: item.title,
        locationLabel: item.locationLabel,
        notes: item.notes ?? "",
        commuteDetails: item.commuteDetails ?? "",
        locationLink: item.locationLink ?? "",
        googleMapsLink: item.googleMapsLink ?? "",
        startTimeLocal: item.startTimeLocal ?? "",
        endTimeLocal: item.endTimeLocal ?? "",
        sortOrder: item.sortOrder,
      }))
  )
}

export function ItineraryPageContent({ trip: tripProp }: { trip: Trip }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp
  const timezone = getTripTimezone(trip)
  const { setTripItineraryItems } = useTripItineraryActions()

  const persistedItems = React.useMemo(() => getTripItineraryItems(trip), [trip])
  const [draftItems, setDraftItems] = React.useState<TripItineraryItem[]>(persistedItems)
  const [calendarView, setCalendarView] = React.useState<View>(() => {
    const calendar = searchParams.get("calendar")
    if (calendar === "month") return Views.MONTH
    if (calendar === "day") return Views.DAY
    if (calendar === "agenda") return Views.AGENDA
    return Views.WEEK
  })
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(() => {
    const status = searchParams.get("status")
    if (status === "planned" || status === "todo" || status === "finished") return status
    return "all"
  })

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<ItineraryDraft>(emptyDraft(trip, 1, "morning"))
  const [copyLinksOpen, setCopyLinksOpen] = React.useState(false)
  const [exportLinks, setExportLinks] = React.useState<string[]>([])
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    setDraftItems(persistedItems)
  }, [persistedItems])

  React.useEffect(() => {
    const evaluate = () => setIsMobile(window.innerWidth < 768)
    evaluate()
    window.addEventListener("resize", evaluate)
    return () => window.removeEventListener("resize", evaluate)
  }, [])

  React.useEffect(() => {
    if (isMobile && calendarView !== Views.DAY) {
      setCalendarView(Views.DAY)
    }
  }, [calendarView, isMobile])

  const syncQueryState = React.useCallback(
    (nextView: View, nextStatus: StatusFilter) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("tab")
      const calendarParam: CalendarViewFilter =
        nextView === Views.MONTH
          ? "month"
          : nextView === Views.DAY
            ? "day"
            : nextView === Views.AGENDA
              ? "agenda"
              : "week"
      params.set("calendar", calendarParam)
      params.set("status", nextStatus)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleCalendarViewChange = React.useCallback(
    (nextView: View) => {
      const safeView = isMobile && nextView !== Views.DAY ? Views.DAY : nextView
      setCalendarView(safeView)
      syncQueryState(safeView, statusFilter)
    },
    [isMobile, statusFilter, syncQueryState]
  )

  const handleStatusFilterChange = React.useCallback(
    (nextStatus: StatusFilter) => {
      setStatusFilter(nextStatus)
      syncQueryState(calendarView, nextStatus)
    },
    [calendarView, syncQueryState]
  )

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const calendarParam: CalendarViewFilter =
      calendarView === Views.MONTH
        ? "month"
        : calendarView === Views.DAY
          ? "day"
          : calendarView === Views.AGENDA
            ? "agenda"
            : "week"
    params.delete("tab")
    params.set("calendar", calendarParam)
    params.set("status", statusFilter)
    const next = `${pathname}?${params.toString()}`
    const current = `${pathname}?${searchParams.toString()}`
    if (next !== current) router.replace(next, { scroll: false })
  }, [calendarView, pathname, router, searchParams, statusFilter])

  const isDirty = React.useMemo(
    () => normalizeForCompare(draftItems) !== normalizeForCompare(persistedItems),
    [draftItems, persistedItems]
  )

  const dayNumbers = React.useMemo(
    () => Array.from({ length: Math.max(1, trip.totalDays) }, (_, index) => index + 1),
    [trip.totalDays]
  )

  const calendarEvents = React.useMemo<CalendarEvent[]>(
    () =>
      draftItems
        .filter((item) => statusFilter === "all" || item.status === statusFilter)
        .map((item) => {
          const start = dateFromLocalString(resolveItineraryStartLocal(item, trip))
          const end = dateFromLocalString(resolveItineraryEndLocal(item, trip))
          if (!start || !end) return null
          const safeEnd = end > start ? end : addMinutes(start, 60)
          return {
            id: item.id,
            title: item.title,
            start,
            end: safeEnd,
            resource: item,
          }
        })
        .filter((event): event is CalendarEvent => Boolean(event)),
    [draftItems, statusFilter, trip]
  )

  const openCreateDialog = React.useCallback(
    (dayIndex = 1, timeBlock: ItineraryTimeBlock = "morning") => {
      setEditingId(null)
      setForm(emptyDraft(trip, dayIndex, timeBlock))
      setDialogOpen(true)
    },
    [trip]
  )

  const openEditDialog = React.useCallback(
    (item: TripItineraryItem) => {
      setEditingId(item.id)
      setForm({
        title: item.title,
        locationLabel: item.locationLabel,
        dayIndex: item.dayIndex,
        timeBlock: item.timeBlock,
        status: item.status,
        category: item.category,
        notes: item.notes ?? "",
        commuteDetails: item.commuteDetails ?? "",
        locationLink: item.locationLink ?? "",
        googleMapsLink: item.googleMapsLink ?? "",
        startTimeLocal: resolveItineraryStartLocal(item, trip),
        endTimeLocal: resolveItineraryEndLocal(item, trip),
      })
      setDialogOpen(true)
    },
    [trip]
  )

  const upsertDraftItem = React.useCallback(() => {
    const validation = validateItineraryItemDraft(
      {
        title: form.title,
        locationLabel: form.locationLabel,
        dayIndex: form.dayIndex,
      },
      trip.totalDays
    )
    if (validation) {
      toast.error(validation)
      return
    }

    const startDate = dateFromLocalString(form.startTimeLocal)
    const endDate = dateFromLocalString(form.endTimeLocal)
    if (!startDate || !endDate || endDate <= startDate) {
      toast.error("End time must be after start time.")
      return
    }

    const inferredDay = inferDayIndexFromDate(startDate, trip)
    const inferredBlock = timeBlockFromDate(startDate)
    const now = new Date().toISOString()

    setDraftItems((prev) => {
      if (editingId) {
        return normalizeSortOrder(
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  title: form.title.trim(),
                  locationLabel: form.locationLabel.trim(),
                  dayIndex: inferredDay,
                  timeBlock: inferredBlock,
                  status: form.status,
                  category: form.category,
                  notes: form.notes.trim() || undefined,
                  commuteDetails: form.commuteDetails.trim() || undefined,
                  locationLink: form.locationLink.trim() || undefined,
                  googleMapsLink: form.googleMapsLink.trim() || undefined,
                  startTimeLocal: form.startTimeLocal,
                  endTimeLocal: form.endTimeLocal,
                  updatedAt: now,
                }
              : item
          )
        )
      }

      const nextItem: TripItineraryItem = {
        id: randomId(),
        tripId: trip.id,
        dayIndex: inferredDay,
        timeBlock: inferredBlock,
        status: form.status,
        category: form.category,
        title: form.title.trim(),
        locationLabel: form.locationLabel.trim(),
        notes: form.notes.trim() || undefined,
        commuteDetails: form.commuteDetails.trim() || undefined,
        locationLink: form.locationLink.trim() || undefined,
        googleMapsLink: form.googleMapsLink.trim() || undefined,
        startTimeLocal: form.startTimeLocal,
        endTimeLocal: form.endTimeLocal,
        sortOrder: 9999,
        createdAt: now,
        updatedAt: now,
      }

      return normalizeSortOrder([...prev, nextItem])
    })

    setDialogOpen(false)
    setEditingId(null)
  }, [editingId, form, trip])

  const handleDeleteItem = React.useCallback((itemId: string) => {
    setDraftItems((prev) => normalizeSortOrder(prev.filter((item) => item.id !== itemId)))
    toast.message("Item removed from draft.")
  }, [])

  const handleSave = React.useCallback(() => {
    for (const item of draftItems) {
      const error = validateItineraryItemDraft(
        {
          title: item.title,
          locationLabel: item.locationLabel,
          dayIndex: item.dayIndex,
        },
        trip.totalDays
      )
      if (error) {
        toast.error(error)
        return
      }
    }

    setTripItineraryItems(trip.id, normalizeSortOrder(draftItems))
    toast.success("Itinerary saved.")
  }, [draftItems, setTripItineraryItems, trip.id, trip.totalDays])

  const handleDiscard = React.useCallback(() => {
    setDraftItems(persistedItems)
    toast.message("Unsaved changes discarded.")
  }, [persistedItems])

  const handleCalendarEventDrop = React.useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date | string; end: Date | string }) => {
      const nextStart = start instanceof Date ? start : new Date(start)
      const nextEnd = end instanceof Date ? end : new Date(end)
      if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) return

      const dayIndex = inferDayIndexFromDate(nextStart, trip)
      const timeBlock = timeBlockFromDate(nextStart)
      setDraftItems((prev) =>
        normalizeSortOrder(
          prev.map((item) =>
            item.id === event.resource.id
              ? {
                  ...item,
                  dayIndex,
                  timeBlock,
                  startTimeLocal: localInputValueFromDate(nextStart),
                  endTimeLocal: localInputValueFromDate(nextEnd),
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        )
      )
    },
    [trip]
  )

  const handleCalendarEventResize = React.useCallback(
    ({ event, start, end }: { event: CalendarEvent; start: Date | string; end: Date | string }) => {
      const nextStart = start instanceof Date ? start : new Date(start)
      const nextEnd = end instanceof Date ? end : new Date(end)
      if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) return

      const dayIndex = inferDayIndexFromDate(nextStart, trip)
      const timeBlock = timeBlockFromDate(nextStart)
      setDraftItems((prev) =>
        normalizeSortOrder(
          prev.map((item) =>
            item.id === event.resource.id
              ? {
                  ...item,
                  dayIndex,
                  timeBlock,
                  startTimeLocal: localInputValueFromDate(nextStart),
                  endTimeLocal: localInputValueFromDate(nextEnd),
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        )
      )
    },
    [trip]
  )

  const handleCalendarSelectSlot = React.useCallback(
    (slot: SlotInfo) => {
      if (!(slot.start instanceof Date) || !(slot.end instanceof Date)) return
      const dayIndex = inferDayIndexFromDate(slot.start, trip)
      const timeBlock = timeBlockFromDate(slot.start)
      setEditingId(null)
      setForm({
        ...emptyDraft(trip, dayIndex, timeBlock),
        dayIndex,
        timeBlock,
        startTimeLocal: localInputValueFromDate(slot.start),
        endTimeLocal: localInputValueFromDate(slot.end),
      })
      setDialogOpen(true)
    },
    [trip]
  )

  const handleExportGoogle = React.useCallback(() => {
    const allItems = normalizeSortOrder(draftItems)
    if (allItems.length === 0) {
      toast.error("No itinerary items to export.")
      return
    }

    const links = buildGoogleExportBatch(allItems, trip)
    const first = window.open(links[0], "_blank")
    if (!first) {
      setExportLinks(links)
      setCopyLinksOpen(true)
      toast.error("Popup blocked. Use the links panel to export all events.")
      return
    }

    links.slice(1).forEach((url, index) => {
      window.setTimeout(() => {
        window.open(url, "_blank")
      }, (index + 1) * 280)
    })

    toast.success(`Opened export for ${allItems.length} events.`)
  }, [draftItems, trip])

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Itinerary Planner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <CalendarDaysIcon className="size-3.5" />
              {trip.totalDays} days • {getDateRangeLabel(trip)} • {timezone}
            </p>
            <div className="flex items-center gap-2">
              {isDirty ? <Badge variant="outline">Unsaved changes</Badge> : null}
              <Button variant="outline" size="sm" onClick={handleDiscard} disabled={!isDirty}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                <SaveIcon />
                Save Changes
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openCreateDialog(1, "morning")}>
                <PlusIcon />
                Add Item
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportGoogle}>
                <ExternalLinkIcon />
                Export All Events
              </Button>
              {draftItems.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setExportLinks(buildGoogleExportBatch(normalizeSortOrder(draftItems), trip))
                    setCopyLinksOpen(true)
                  }}
                >
                  Copy Event Links
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Button
              size="sm"
              variant={statusFilter === "all" ? "secondary" : "outline"}
              onClick={() => handleStatusFilterChange("all")}
            >
              All
            </Button>
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status.key}
                size="sm"
                variant={statusFilter === status.key ? "secondary" : "outline"}
                onClick={() => handleStatusFilterChange(status.key)}
              >
                {status.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {CATEGORY_OPTIONS.map((category) => (
              <span key={category.key} className={`inline-flex rounded px-1.5 py-0.5 text-[10px] ${category.className}`}>
                {category.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none">
        <CardContent className="space-y-3 pt-4">
          <div className="rounded-md bg-muted/20 p-2">
            {calendarView === Views.AGENDA ? (
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                view={calendarView}
                onView={handleCalendarViewChange}
                views={isMobile ? [Views.DAY, Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultDate={dateForTripDay(trip.startDate, 1)}
                startAccessor="start"
                endAccessor="end"
                style={{ height: isMobile ? 520 : 780 }}
                popup
                onSelectEvent={(event) => openEditDialog(event.resource)}
                eventPropGetter={(event) => ({
                  className: `border-0 ${categoryClass(event.resource.category)} text-[11px]`,
                })}
              />
            ) : (
              <DnDCalendar
                localizer={localizer}
                events={calendarEvents}
                view={calendarView}
                onView={handleCalendarViewChange}
                views={isMobile ? [Views.DAY, Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultDate={dateForTripDay(trip.startDate, 1)}
                startAccessor="start"
                endAccessor="end"
                style={{ height: isMobile ? 520 : 780 }}
                selectable
                resizable
                popup
                onSelectEvent={(event) => openEditDialog(event.resource)}
                onSelectSlot={handleCalendarSelectSlot}
                onEventDrop={handleCalendarEventDrop}
                onEventResize={handleCalendarEventResize}
                eventPropGetter={(event) => ({
                  className: `border-0 ${categoryClass(event.resource.category)} text-[11px]`,
                })}
              />
            )}
          </div>

          <div className="rounded-md bg-muted/20 p-2">
            <p className="mb-2 text-sm font-medium">Current Items</p>
            <div className="space-y-2">
              {normalizeSortOrder(draftItems).map((item) => (
                <div key={item.id} className="rounded bg-background p-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.locationLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {resolveItineraryStartLocal(item, trip)} - {resolveItineraryEndLocal(item, trip)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2Icon className="size-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {draftItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">No itinerary items yet.</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit itinerary item" : "Add itinerary item"}</DialogTitle>
            <DialogDescription>
              Title and location are required. Times drive day/block mapping automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Berlin Core Sights"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Location</label>
                <Input
                  value={form.locationLabel}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, locationLabel: event.target.value }))
                  }
                  placeholder="Berlin, Germany"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Day</label>
                <Select
                  value={String(form.dayIndex)}
                  onValueChange={(value) => {
                    const dayIndex = Number(value)
                    const defaults = buildDefaultTimes(trip, dayIndex, form.timeBlock)
                    setForm((prev) => ({ ...prev, dayIndex, ...defaults }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNumbers.map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        Day {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Time block</label>
                <Select
                  value={form.timeBlock}
                  onValueChange={(value) => {
                    const timeBlock = value as ItineraryTimeBlock
                    const defaults = buildDefaultTimes(trip, form.dayIndex, timeBlock)
                    setForm((prev) => ({ ...prev, timeBlock, ...defaults }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Time block" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_BLOCKS.map((block) => (
                      <SelectItem key={block.key} value={block.key}>
                        {block.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, status: value as ItineraryStatus }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.key} value={status.key}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, category: value as ItineraryCategory }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category.key} value={category.key}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Start time</label>
                <Input
                  type="datetime-local"
                  value={form.startTimeLocal}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startTimeLocal: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">End time</label>
                <Input
                  type="datetime-local"
                  value={form.endTimeLocal}
                  onChange={(event) => setForm((prev) => ({ ...prev, endTimeLocal: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Location Link (optional)</label>
                <Input
                  value={form.locationLink}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, locationLink: event.target.value }))
                  }
                  placeholder="https://example.com/location"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Google Maps Link (optional)</label>
                <Input
                  value={form.googleMapsLink}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, googleMapsLink: event.target.value }))
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Commuting Details (optional)</label>
              <Input
                value={form.commuteDetails}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, commuteDetails: event.target.value }))
                }
                placeholder="ICE 726, 07:42 to 11:02"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Tickets required, expected queue, reminders"
              />
            </div>

            {(form.locationLink || form.googleMapsLink) && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {form.locationLink ? (
                  <a href={form.locationLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                    <LinkIcon className="size-3" />
                    Location link
                  </a>
                ) : null}
                {form.googleMapsLink ? (
                  <a href={form.googleMapsLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                    <ExternalLinkIcon className="size-3" />
                    Google Maps
                  </a>
                ) : null}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upsertDraftItem}>{editingId ? "Update item" : "Add item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyLinksOpen} onOpenChange={setCopyLinksOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Google Calendar Event Links</DialogTitle>
            <DialogDescription>
              Use these links if your browser blocks popup windows.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-md bg-muted/20 p-2">
            {exportLinks.map((link, index) => {
              const item = draftItems[index]
              return (
                <div key={link} className="rounded bg-background p-2">
                  <p className="mb-1 text-xs font-medium">{item?.title ?? `Event ${index + 1}`}</p>
                  <p className="truncate text-xs text-muted-foreground">{link}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={link} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await navigator.clipboard.writeText(link)
                        toast.success("Event link copied.")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyLinksOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
