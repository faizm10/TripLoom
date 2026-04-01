"use client"

import * as React from "react"
import type { ViewProps } from "react-big-calendar"
// TimeGrid is the same primitive the built-in Week view uses.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- no public export
// @ts-expect-error internal path
import TimeGrid from "react-big-calendar/lib/TimeGrid"

import { tripCalendarBufferFirstDay, tripCalendarBufferLastDay } from "@/lib/trip-calendar-buffer"
import type { Trip } from "@/lib/trips"

type LocalizerLike = {
  range: (start: Date, end: Date) => Date[]
  startOf: (d: Date, unit: string) => Date
  endOf: (d: Date, unit: string) => Date
  format: (value: unknown, format: string) => string
  add: (d: Date, n: number, unit: string) => Date
}

/**
 * Week-style time grid whose columns are exactly: trip start − 1 day … trip end + 1 day (inclusive).
 */
export function createTripBufferedWeekView(trip: Trip) {
  function TripBufferedWeek(props: ViewProps) {
    const {
      date,
      localizer,
      min: minProp,
      max: maxProp,
      scrollToTime: scrollToTimeProp,
      enableAutoScroll = true,
      ...rest
    } = props

    const loc = localizer as LocalizerLike
    const min =
      minProp === undefined ? loc.startOf(new Date(), "day") : minProp
    const max = maxProp === undefined ? loc.endOf(new Date(), "day") : maxProp
    const scrollToTime =
      scrollToTimeProp === undefined ? loc.startOf(new Date(), "day") : scrollToTimeProp

    const range = TripBufferedWeek.range(new Date(date as Date | string), { localizer: loc })

    return (
      <TimeGrid
        {...rest}
        date={date}
        localizer={localizer}
        range={range}
        eventOffset={15}
        min={min}
        max={max}
        scrollToTime={scrollToTime}
        enableAutoScroll={enableAutoScroll}
      />
    )
  }

  TripBufferedWeek.range = (_date: Date | string, { localizer }: { localizer: LocalizerLike }) => {
    const first = tripCalendarBufferFirstDay(trip)
    const last = tripCalendarBufferLastDay(trip)
    return localizer.range(first, last)
  }

  TripBufferedWeek.navigate = (date: Date, _action: string, _options: unknown) => date

  TripBufferedWeek.title = (date: Date, options: { localizer: LocalizerLike }) => {
    const r = TripBufferedWeek.range(date, options)
    if (!r.length) return ""
    return options.localizer.format({ start: r[0], end: r[r.length - 1] }, "dayRangeHeaderFormat")
  }

  return TripBufferedWeek as React.ComponentType<ViewProps> & {
    range: (d: Date | string, o: { localizer: LocalizerLike }) => Date[]
    navigate: (d: Date, a: string, o: unknown) => Date
    title: (d: Date, o: { localizer: LocalizerLike }) => string
  }
}
