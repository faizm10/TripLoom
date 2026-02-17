import type { Trip, TripItineraryItem } from "@/lib/trips"
import {
  getTripTimezone,
  resolveItineraryEndLocal,
  resolveItineraryStartLocal,
} from "@/lib/trips"

function encodeDateTimeForGoogle(localDateTime: string): string {
  const compact = localDateTime.replace(/[-:]/g, "")
  if (compact.length === 13) return `${compact}00`
  if (compact.length === 15) return compact
  return compact.slice(0, 15)
}

function buildEventDateRange(item: TripItineraryItem, trip: Trip): string {
  const start = encodeDateTimeForGoogle(resolveItineraryStartLocal(item, trip))
  const end = encodeDateTimeForGoogle(resolveItineraryEndLocal(item, trip))
  return `${start}/${end}`
}

export function formatEventDescription(item: TripItineraryItem): string {
  const details: string[] = []
  if (item.category) details.push(`Category: ${item.category}`)
  if (item.commuteDetails) details.push(`Commute: ${item.commuteDetails}`)
  if (item.notes) details.push(item.notes)
  if (item.locationLink) details.push(`Location link: ${item.locationLink}`)
  if (item.googleMapsLink) details.push(`Google Maps: ${item.googleMapsLink}`)
  return details.join("\n")
}

export function buildGoogleCalendarUrl(item: TripItineraryItem, trip: Trip): string {
  const timezone = getTripTimezone(trip)
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: item.title,
    dates: buildEventDateRange(item, trip),
    location: item.locationLabel,
    details: formatEventDescription(item),
    ctz: timezone,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildGoogleExportBatch(items: TripItineraryItem[], trip: Trip): string[] {
  return items
    .slice()
    .sort((a, b) => a.dayIndex - b.dayIndex || a.sortOrder - b.sortOrder)
    .map((item) => buildGoogleCalendarUrl(item, trip))
}
