import { differenceInCalendarDays } from "date-fns"

import type { Trip } from "@/lib/trips"

/** First calendar day shown: one day before `trip.startDate` (local). */
export function tripCalendarBufferFirstDay(trip: Trip): Date {
  const [y, m, d] = trip.startDate.split("-").map(Number)
  const first = new Date(y, (m || 1) - 1, d || 1)
  first.setDate(first.getDate() - 1)
  first.setHours(0, 0, 0, 0)
  return first
}

/** Last calendar day shown: one day after `trip.endDate` (local). */
export function tripCalendarBufferLastDay(trip: Trip): Date {
  const [y, m, d] = trip.endDate.split("-").map(Number)
  const last = new Date(y, (m || 1) - 1, d || 1)
  last.setDate(last.getDate() + 1)
  last.setHours(0, 0, 0, 0)
  return last
}

/** Inclusive day count from buffer first through buffer last. */
export function tripCalendarBufferedDayCount(trip: Trip): number {
  const first = tripCalendarBufferFirstDay(trip)
  const last = tripCalendarBufferLastDay(trip)
  return differenceInCalendarDays(last, first) + 1
}
