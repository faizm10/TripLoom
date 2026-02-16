"use client"

import * as React from "react"
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  defaultAnimateLayoutChanges,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import { CalendarDaysIcon, GripVerticalIcon, MapPinIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
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
import type {
  ItineraryCategory,
  ItineraryStatus,
  ItineraryTimeBlock,
  Trip,
  TripItineraryItem,
} from "@/lib/trips"
import {
  getDateRangeLabel,
  getTripItineraryItems,
  groupItineraryByDayAndBlock,
  normalizeSortOrder,
  validateItineraryItemDraft,
} from "@/lib/trips"

type StatusFilter = "all" | ItineraryStatus

type ItineraryDraft = {
  title: string
  locationLabel: string
  dayIndex: number
  timeBlock: ItineraryTimeBlock
  status: ItineraryStatus
  category: ItineraryCategory
  notes: string
}

const TIME_BLOCKS: Array<{ key: ItineraryTimeBlock; label: string }> = [
  { key: "morning", label: "Start Of Day" },
  { key: "afternoon", label: "Midday Focus" },
  { key: "evening", label: "Evening Wind-Down" },
]

const STATUS_OPTIONS: Array<{ key: ItineraryStatus; label: string }> = [
  { key: "planned", label: "Planned" },
  { key: "todo", label: "To Do" },
  { key: "finished", label: "Finished" },
]

const CATEGORY_OPTIONS: Array<{ key: ItineraryCategory; label: string; color: string }> = [
  { key: "outbound_flight", label: "Outbound Flight", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "inbound_flight", label: "Inbound Flight", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { key: "commute", label: "Commute", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { key: "activities", label: "Activities", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "games", label: "Games", color: "bg-violet-100 text-violet-800 border-violet-200" },
  { key: "food", label: "Food", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "sightseeing", label: "Sightseeing", color: "bg-rose-100 text-rose-800 border-rose-200" },
  { key: "shopping", label: "Shopping", color: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" },
  { key: "rest", label: "Rest", color: "bg-slate-100 text-slate-800 border-slate-200" },
  { key: "other", label: "Other", color: "bg-zinc-100 text-zinc-800 border-zinc-200" },
]

function categoryClasses(category: ItineraryCategory): string {
  return (
    CATEGORY_OPTIONS.find((option) => option.key === category)?.color ||
    "bg-zinc-100 text-zinc-800 border-zinc-200"
  )
}

function laneId(dayIndex: number, timeBlock: ItineraryTimeBlock): string {
  return `day-${dayIndex}-block-${timeBlock}`
}

function parseLaneId(id: string): { dayIndex: number; timeBlock: ItineraryTimeBlock } | null {
  const match = id.match(/^day-(\d+)-block-(morning|afternoon|evening)$/)
  if (!match) return null
  return {
    dayIndex: Number(match[1]),
    timeBlock: match[2] as ItineraryTimeBlock,
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `it-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getLaneItems(
  items: TripItineraryItem[],
  dayIndex: number,
  timeBlock: ItineraryTimeBlock,
  filter: StatusFilter
): TripItineraryItem[] {
  return items
    .filter(
      (item) =>
        item.dayIndex === dayIndex &&
        item.timeBlock === timeBlock &&
        (filter === "all" || item.status === filter)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
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
        notes: item.notes || "",
        sortOrder: item.sortOrder,
      }))
  )
}

function statusBadgeVariant(status: ItineraryStatus): "secondary" | "outline" {
  return status === "finished" ? "secondary" : "outline"
}

function ItineraryCardBody({
  item,
  onEdit,
  onDelete,
}: {
  item: TripItineraryItem
  onEdit: (item: TripItineraryItem) => void
  onDelete: (itemId: string) => void
}) {
  return (
    <>
      <div className="mb-1 flex items-center gap-1">
        <Badge variant={statusBadgeVariant(item.status)} className="rounded-none text-[10px]">
          {STATUS_OPTIONS.find((option) => option.key === item.status)?.label || "Planned"}
        </Badge>
        <span className={`inline-flex rounded-none border px-1.5 py-0.5 text-[10px] ${categoryClasses(item.category)}`}>
          {CATEGORY_OPTIONS.find((option) => option.key === item.category)?.label || "Other"}
        </span>
      </div>

      <p className="font-medium text-foreground">{item.title}</p>
      <p className="mt-1 flex items-center gap-1 text-muted-foreground">
        <MapPinIcon className="size-3" />
        {item.locationLabel}
      </p>

      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={() => onDelete(item.id)}
        >
          <Trash2Icon className="size-3" />
          Delete
        </Button>
      </div>
    </>
  )
}

function applyDrag(
  items: TripItineraryItem[],
  activeId: string,
  overId: string
): TripItineraryItem[] {
  const active = items.find((item) => item.id === activeId)
  if (!active) return items

  let targetDay = active.dayIndex
  let targetBlock = active.timeBlock
  let targetIndex = -1

  const parsedLane = parseLaneId(overId)
  if (parsedLane) {
    targetDay = parsedLane.dayIndex
    targetBlock = parsedLane.timeBlock
    targetIndex = getLaneItems(items, targetDay, targetBlock, "all").length
  } else {
    const overItem = items.find((item) => item.id === overId)
    if (!overItem) return items
    targetDay = overItem.dayIndex
    targetBlock = overItem.timeBlock
    const targetLaneItems = getLaneItems(items, targetDay, targetBlock, "all")
    targetIndex = targetLaneItems.findIndex((item) => item.id === overItem.id)
  }

  if (targetIndex < 0) return items

  const sourceLaneAll = getLaneItems(items, active.dayIndex, active.timeBlock, "all")
  const targetLaneAll = getLaneItems(items, targetDay, targetBlock, "all")

  if (active.dayIndex === targetDay && active.timeBlock === targetBlock) {
    const fromIndex = sourceLaneAll.findIndex((item) => item.id === activeId)
    if (fromIndex < 0 || fromIndex === targetIndex) return items
    const reorderedIds = arrayMove(
      sourceLaneAll.map((item) => item.id),
      fromIndex,
      targetIndex
    )
    const updated = items.map((item) => {
      if (item.dayIndex === active.dayIndex && item.timeBlock === active.timeBlock) {
        const idx = reorderedIds.indexOf(item.id)
        if (idx >= 0) return { ...item, sortOrder: (idx + 1) * 10, updatedAt: new Date().toISOString() }
      }
      return item
    })
    return normalizeSortOrder(updated)
  }

  const sourceIds = sourceLaneAll.map((item) => item.id).filter((id) => id !== activeId)
  const targetIds = targetLaneAll.map((item) => item.id).filter((id) => id !== activeId)
  const insertAt = Math.min(Math.max(0, targetIndex), targetIds.length)
  targetIds.splice(insertAt, 0, activeId)

  const updated = items.map((item) => {
    if (item.id === activeId) {
      return {
        ...item,
        dayIndex: targetDay,
        timeBlock: targetBlock,
        sortOrder: (insertAt + 1) * 10,
        updatedAt: new Date().toISOString(),
      }
    }

    if (item.dayIndex === active.dayIndex && item.timeBlock === active.timeBlock) {
      const idx = sourceIds.indexOf(item.id)
      if (idx >= 0) return { ...item, sortOrder: (idx + 1) * 10, updatedAt: new Date().toISOString() }
    }

    if (item.dayIndex === targetDay && item.timeBlock === targetBlock) {
      const idx = targetIds.indexOf(item.id)
      if (idx >= 0) return { ...item, sortOrder: (idx + 1) * 10, updatedAt: new Date().toISOString() }
    }

    return item
  })

  return normalizeSortOrder(updated)
}

function ItineraryCardItem({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: TripItineraryItem
  onEdit: (item: TripItineraryItem) => void
  onDelete: (itemId: string) => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
    animateLayoutChanges: defaultAnimateLayoutChanges,
    transition: {
      duration: 220,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)",
  }

  return (
    <motion.div
      ref={setNodeRef}
      layout
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.55 }}
      style={style}
      className={`rounded-none bg-background/90 p-2 text-xs shadow-sm ring-1 ring-border/50 ${isDragging ? "opacity-70" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label="Drag itinerary item"
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
        <span />
      </div>

      <ItineraryCardBody item={item} onEdit={onEdit} onDelete={onDelete} />
    </motion.div>
  )
}

function ItineraryLane({
  dayIndex,
  timeBlock,
  items,
  onCreate,
  onEdit,
  onDelete,
  dragDisabled,
}: {
  dayIndex: number
  timeBlock: ItineraryTimeBlock
  items: TripItineraryItem[]
  onCreate: (dayIndex: number, timeBlock: ItineraryTimeBlock) => void
  onEdit: (item: TripItineraryItem) => void
  onDelete: (itemId: string) => void
  dragDisabled: boolean
}) {
  const id = laneId(dayIndex, timeBlock)
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="space-y-2 rounded-none bg-muted/10 p-2">
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-[10px]"
          onClick={() => onCreate(dayIndex, timeBlock)}
        >
          <PlusIcon className="size-3" />
          Add
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-16 space-y-2 rounded-none p-1 transition-colors ${isOver ? "bg-accent/30" : "bg-background/40"}`}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No items</p>
          ) : (
            items.map((item) => (
              <ItineraryCardItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={dragDisabled}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function ItineraryPageContent({ trip: tripProp }: { trip: Trip }) {
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp
  const { setTripItineraryItems } = useTripItineraryActions()

  const persistedItems = React.useMemo(() => getTripItineraryItems(trip), [trip])
  const [draftItems, setDraftItems] = React.useState<TripItineraryItem[]>(persistedItems)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<ItineraryDraft>({
    title: "",
    locationLabel: "",
    dayIndex: 1,
    timeBlock: "morning",
    status: "planned",
    category: "activities",
    notes: "",
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  React.useEffect(() => {
    setDraftItems(persistedItems)
  }, [persistedItems])

  const isDirty = React.useMemo(
    () => normalizeForCompare(draftItems) !== normalizeForCompare(persistedItems),
    [draftItems, persistedItems]
  )

  React.useEffect(() => {
    if (!isDirty) return
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [isDirty])

  const dayNumbers = React.useMemo(
    () => Array.from({ length: Math.max(1, trip.totalDays) }, (_, index) => index + 1),
    [trip.totalDays]
  )

  const grouped = React.useMemo(
    () => groupItineraryByDayAndBlock(draftItems, trip.totalDays),
    [draftItems, trip.totalDays]
  )

  const openCreateDialog = React.useCallback((dayIndex = 1, timeBlock: ItineraryTimeBlock = "morning") => {
    setEditingId(null)
    setForm({
      title: "",
      locationLabel: "",
      dayIndex,
      timeBlock,
      status: "planned",
      category: "activities",
      notes: "",
    })
    setDialogOpen(true)
  }, [])

  const openEditDialog = React.useCallback((item: TripItineraryItem) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      locationLabel: item.locationLabel,
      dayIndex: item.dayIndex,
      timeBlock: item.timeBlock,
      status: item.status,
      category: item.category,
      notes: item.notes || "",
    })
    setDialogOpen(true)
  }, [])

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
                  dayIndex: form.dayIndex,
                  timeBlock: form.timeBlock,
                  status: form.status,
                  category: form.category,
                  notes: form.notes.trim() || undefined,
                  startTimeLocal: undefined,
                  endTimeLocal: undefined,
                  updatedAt: now,
                }
              : item
          )
        )
      }

      const laneItems = getLaneItems(prev, form.dayIndex, form.timeBlock, "all")
      const nextItem: TripItineraryItem = {
        id: randomId(),
        tripId: trip.id,
        dayIndex: form.dayIndex,
        timeBlock: form.timeBlock,
        status: form.status,
        category: form.category,
        title: form.title.trim(),
        locationLabel: form.locationLabel.trim(),
        notes: form.notes.trim() || undefined,
        startTimeLocal: undefined,
        endTimeLocal: undefined,
        sortOrder: (laneItems.length + 1) * 10,
        createdAt: now,
        updatedAt: now,
      }
      return normalizeSortOrder([...prev, nextItem])
    })

    setDialogOpen(false)
    setEditingId(null)
  }, [editingId, form, trip.id, trip.totalDays])

  const handleDelete = React.useCallback((itemId: string) => {
    setDraftItems((prev) => normalizeSortOrder(prev.filter((item) => item.id !== itemId)))
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
    toast.success("Itinerary changes saved.")
  }, [draftItems, setTripItineraryItems, trip.id, trip.totalDays])

  const handleDiscard = React.useCallback(() => {
    setDraftItems(persistedItems)
    toast.message("Unsaved itinerary changes discarded.")
  }, [persistedItems])

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null)
      if (statusFilter !== "all") return
      const activeId = String(event.active.id)
      const overId = event.over ? String(event.over.id) : ""
      if (!activeId || !overId || activeId === overId) return

      setDraftItems((prev) => applyDrag(prev, activeId, overId))
    },
    [statusFilter]
  )

  const onDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const onDragCancel = React.useCallback((_event: DragCancelEvent) => {
    setActiveDragId(null)
  }, [])

  const activeDragItem = React.useMemo(
    () => draftItems.find((item) => item.id === activeDragId) ?? null,
    [activeDragId, draftItems]
  )

  return (
    <div className="space-y-4 overflow-x-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Itinerary Board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="flex items-center gap-1 text-muted-foreground">
              <CalendarDaysIcon className="size-3.5" />
              {trip.totalDays} days • {getDateRangeLabel(trip)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {isDirty && <Badge variant="outline" className="rounded-none">Unsaved changes</Badge>}
              <Button variant="outline" size="sm" onClick={() => openCreateDialog(1, "morning")}>
                <PlusIcon /> Add Item
              </Button>
              <Button variant="outline" size="sm" onClick={handleDiscard} disabled={!isDirty}>
                Discard Changes
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                <SaveIcon /> Save Changes
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Button
              size="sm"
              variant={statusFilter === "all" ? "secondary" : "outline"}
              className="rounded-none"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status.key}
                size="sm"
                variant={statusFilter === status.key ? "secondary" : "outline"}
                className="rounded-none"
                onClick={() => setStatusFilter(status.key)}
              >
                {status.label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Legend</p>
            <div className="flex flex-wrap gap-1">
              {CATEGORY_OPTIONS.map((category) => (
                <span
                  key={category.key}
                  className={`inline-flex rounded-none border px-1.5 py-0.5 text-[10px] ${category.color}`}
                >
                  {category.label}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Use flight tags for travel days: Outbound Flight and Inbound Flight.</p>
          </div>

          {statusFilter !== "all" && (
            <p className="text-xs text-muted-foreground">
              Drag reorder is disabled while status filter is active.
            </p>
          )}
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-3 pb-2 sm:grid-cols-2 xl:grid-cols-3">
          {dayNumbers.map((day) => (
            <section key={`day-${day}`} className="rounded-none bg-card/70 p-3 ring-1 ring-border/50">
              <h3 className="mb-2 text-sm font-semibold">Day {day}</h3>
              <div className="space-y-3">
                {TIME_BLOCKS.map((block) => (
                  <div key={`${day}-${block.key}`} className="space-y-1">
                    <div className="border-b pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {block.label}
                    </div>
                    <ItineraryLane
                      dayIndex={day}
                      timeBlock={block.key}
                      items={getLaneItems(grouped[day]?.[block.key] ?? [], day, block.key, statusFilter)}
                      onCreate={openCreateDialog}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      dragDisabled={statusFilter !== "all"}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }} zIndex={20}>
          {activeDragItem ? (
            <motion.div
              initial={{ scale: 0.98, opacity: 0.95 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-[290px] rounded-none border bg-background p-2 text-xs shadow-lg"
            >
              <ItineraryCardBody item={activeDragItem} onEdit={() => {}} onDelete={() => {}} />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {draftItems.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No itinerary items yet. Add your first Morning, Afternoon, or Evening block.
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Itinerary Item" : "Add Itinerary Item"}</DialogTitle>
            <DialogDescription>
              Title and location are required. Day and time block determine where this card appears.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Visit museum"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Location</label>
              <Input
                value={form.locationLabel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, locationLabel: event.target.value }))
                }
                placeholder="Berlin Cathedral"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Day</label>
                <Select
                  value={String(form.dayIndex)}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, dayIndex: Number(value) }))
                  }
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
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, timeBlock: value as ItineraryTimeBlock }))
                  }
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

            <div className="space-y-1">
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Tickets required, 30 min queue"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upsertDraftItem}>{editingId ? "Update item" : "Add item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
