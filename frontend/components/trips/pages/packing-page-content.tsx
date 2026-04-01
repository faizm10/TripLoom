"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useTripPage } from "@/components/trips/trip-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  deletePackingItemFromSupabase,
  listGroupPackingItemsFromSupabase,
  listPersonalPackingItemsFromSupabase,
  savePackingItemToSupabase,
  updatePackingItemCheckedInSupabase,
  type PackingItem,
  type PackingScope,
} from "@/lib/supabase-trip-packing"

function nextSortOrder(items: PackingItem[]): number {
  if (items.length === 0) return 0
  return Math.max(...items.map((i) => i.sortOrder)) + 1
}

function newPackingId(tripId: string, scope: PackingScope): string {
  return `${tripId}:pack:${scope}:${Date.now().toString(36)}`
}

export function PackingPageContent() {
  const trip = useTripPage()
  const [personal, setPersonal] = React.useState<PackingItem[]>([])
  const [group, setGroup] = React.useState<PackingItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const inputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map())

  const load = React.useCallback(async () => {
    if (!trip?.id) return
    setLoading(true)
    try {
      const [pRows, gRows] = await Promise.all([
        listPersonalPackingItemsFromSupabase(trip.id),
        trip.isGroupTrip ? listGroupPackingItemsFromSupabase(trip.id) : Promise.resolve([] as PackingItem[]),
      ])
      setPersonal(pRows)
      setGroup(gRows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load packing lists.")
    } finally {
      setLoading(false)
    }
  }, [trip?.id, trip?.isGroupTrip])

  React.useEffect(() => {
    void load()
  }, [load])

  const persistItem = async (
    scope: PackingScope,
    payload: PackingItem,
    setList: React.Dispatch<React.SetStateAction<PackingItem[]>>
  ) => {
    if (!trip?.id) return
    try {
      await savePackingItemToSupabase(
        trip.id,
        {
          id: payload.id,
          label: payload.label,
          isChecked: payload.isChecked,
          sortOrder: payload.sortOrder,
        },
        scope
      )
      setList((prev) => {
        const idx = prev.findIndex((x) => x.id === payload.id)
        if (idx < 0) return [...prev, payload].sort((a, b) => a.sortOrder - b.sortOrder)
        const next = [...prev]
        next[idx] = payload
        return next.sort((a, b) => a.sortOrder - b.sortOrder)
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save item.")
    }
  }

  const toggleChecked = async (
    scope: PackingScope,
    item: PackingItem,
    checked: boolean,
    setList: React.Dispatch<React.SetStateAction<PackingItem[]>>
  ) => {
    if (!trip?.id) return
    setList((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isChecked: checked } : row))
    )
    try {
      await updatePackingItemCheckedInSupabase(trip.id, item.id, checked)
    } catch (e) {
      setList((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isChecked: item.isChecked } : row))
      )
      toast.error(e instanceof Error ? e.message : "Could not update checkbox.")
    }
  }

  const removeItem = async (
    scope: PackingScope,
    id: string,
    setList: React.Dispatch<React.SetStateAction<PackingItem[]>>
  ) => {
    if (!trip?.id) return
    const prevSnapshot = scope === "personal" ? personal : group
    setList((prev) => prev.filter((x) => x.id !== id))
    try {
      await deletePackingItemFromSupabase(trip.id, id)
    } catch (e) {
      if (scope === "personal") setPersonal(prevSnapshot)
      else setGroup(prevSnapshot)
      toast.error(e instanceof Error ? e.message : "Could not remove item.")
    }
  }

  const appendRow = (
    scope: PackingScope,
    list: PackingItem[],
    options?: { syncDom?: boolean }
  ): PackingItem | null => {
    if (!trip?.id) return null
    const setList = scope === "personal" ? setPersonal : setGroup
    const item: PackingItem = {
      id: newPackingId(trip.id, scope),
      tripId: trip.id,
      userId: scope === "group" ? null : "",
      label: "",
      isChecked: false,
      sortOrder: nextSortOrder(list),
    }
    const append = (prev: PackingItem[]) => [...prev, item]
    if (options?.syncDom) {
      flushSync(() => setList(append))
    } else {
      setList(append)
    }
    void (async () => {
      try {
        await savePackingItemToSupabase(
          trip.id,
          {
            id: item.id,
            label: item.label,
            isChecked: item.isChecked,
            sortOrder: item.sortOrder,
          },
          scope
        )
      } catch (e) {
        setList((prev) => prev.filter((x) => x.id !== item.id))
        toast.error(e instanceof Error ? e.message : "Could not add item.")
      }
    })()
    return item
  }

  const addItem = (scope: PackingScope) => {
    const list = scope === "personal" ? personal : group
    void appendRow(scope, list)
  }

  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }

  const renderSection = (
    title: string,
    description: string,
    scope: PackingScope,
    items: PackingItem[],
    setList: React.Dispatch<React.SetStateAction<PackingItem[]>>
  ) => (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-11 w-full shrink-0 touch-manipulation sm:h-9 sm:w-auto"
          onClick={() => addItem(scope)}
        >
          <PlusIcon className="size-4" />
          Add item
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet. Add something to pack.</p>
        ) : (
          <ul className="space-y-3 sm:space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-border/90 bg-secondary/15 px-3 py-3 shadow-sm transition-colors hover:bg-secondary/25 dark:border-border dark:bg-secondary/25 dark:shadow-none dark:hover:bg-secondary/35 sm:flex-row sm:items-center sm:gap-3 sm:rounded-lg sm:px-3 sm:py-2.5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Checkbox
                    checked={item.isChecked}
                    onCheckedChange={(v) =>
                      void toggleChecked(scope, item, v === true, setList)
                    }
                    aria-label={`Packed: ${item.label || "item"}`}
                    className="size-5 sm:size-4"
                  />
                  <Input
                    ref={(el) => {
                      if (el) inputRefs.current.set(item.id, el)
                      else inputRefs.current.delete(item.id)
                    }}
                    className="min-h-11 flex-1 border-0 bg-transparent px-0 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:bg-transparent dark:focus-visible:ring-ring/60 dark:focus-visible:ring-offset-background sm:min-h-9 sm:text-xs"
                    value={item.label}
                    placeholder="Item name"
                    onChange={(e) =>
                      setList((prev) =>
                        prev.map((row) =>
                          row.id === item.id ? { ...row, label: e.target.value } : row
                        )
                      )
                    }
                    onBlur={(e) => {
                      const trimmed = e.target.value.trim()
                      void persistItem(scope, { ...item, label: trimmed }, setList)
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      const input = e.currentTarget
                      const trimmed = input.value.trim()
                      void persistItem(scope, { ...item, label: trimmed }, setList)
                      const idx = items.findIndex((r) => r.id === item.id)
                      if (idx < 0) return
                      if (idx < items.length - 1) {
                        const nextId = items[idx + 1].id
                        requestAnimationFrame(() => inputRefs.current.get(nextId)?.focus())
                        return
                      }
                      const created = appendRow(scope, items, { syncDom: true })
                      if (created) {
                        requestAnimationFrame(() => inputRefs.current.get(created.id)?.focus())
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 shrink-0 touch-manipulation self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:size-8 sm:self-center dark:hover:bg-destructive/20"
                  aria-label="Remove item"
                  onClick={() => void removeItem(scope, item.id, setList)}
                >
                  <Trash2Icon className="size-5 sm:size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )

  const personalTitle = trip.isGroupTrip ? "Your packing" : "Packing list"
  const personalDesc = trip.isGroupTrip
    ? "Only you can see this list—your personal items on top of the shared group list."
    : "Your checklist for this trip."

  return (
    <div className="space-y-6">
      {renderSection(personalTitle, personalDesc, "personal", personal, setPersonal)}
      {trip.isGroupTrip
        ? renderSection(
            "Group packing",
            "Shared with everyone on this trip. Anyone in the group can add, check off, or remove items.",
            "group",
            group,
            setGroup
          )
        : null}
    </div>
  )
}
