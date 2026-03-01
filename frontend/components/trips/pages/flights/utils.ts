/**
 * Pure helpers for the flights page: formatting, offer row extraction, sorting.
 */

import type { FlightOffer } from "@/lib/flights"
import type { StopDetail } from "./types"

export const MIN_DATE = new Date().toISOString().slice(0, 10)

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  } catch {
    return iso
  }
}

export function formatDate(iso: string): string {
  try {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const d = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : new Date(iso)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function getOfferRow(offer: FlightOffer) {
  const slice = offer.slices[0]
  const firstSeg = slice?.segments?.[0]
  const route =
    offer.slices.length > 1
      ? offer.slices
          .map(
            (s) =>
              `${s.origin?.iataCode ?? ""} → ${s.destination?.iataCode ?? ""}`
          )
          .join(" · ")
      : `${slice?.origin?.iataCode ?? ""} → ${slice?.destination?.iataCode ?? ""}`
  const dates =
    offer.slices.length > 1
      ? offer.slices
          .map((s) => {
            const seg = s.segments?.[0]
            return seg?.departingAt
              ? formatDate(seg.departingAt.slice(0, 10))
              : ""
          })
          .filter(Boolean)
          .join(" · ")
      : firstSeg?.departingAt != null
        ? formatDate(firstSeg.departingAt.slice(0, 10))
        : ""
  const departure = firstSeg ? formatTime(firstSeg.departingAt) : ""
  const arrival = firstSeg ? formatTime(firstSeg.arrivingAt) : ""
  const duration = slice?.duration ?? ""
  return { route, dateStr: dates, departure, arrival, duration }
}

export function getStopsLabel(offer: FlightOffer): string {
  const parts = offer.slices.map((slice) => {
    const n = Math.max(0, (slice.segments?.length ?? 1) - 1)
    if (n === 0) return "Non-stop"
    if (n === 1) return "1 stop"
    return `${n} stops`
  })
  return parts.join(" · ")
}

export function getStopsCount(offer: FlightOffer): number {
  return offer.slices.reduce(
    (sum, slice) => sum + Math.max(0, (slice.segments?.length ?? 1) - 1),
    0
  )
}

export function getStopDetails(offer: FlightOffer): StopDetail[] {
  const out: StopDetail[] = []
  offer.slices.forEach((slice, sliceIndex) => {
    const segs = slice.segments ?? []
    for (let i = 0; i < segs.length - 1; i++) {
      const arr = segs[i]
      const dep = segs[i + 1]
      const dest = arr.destination
      const arrTime = arr.arrivingAt ? new Date(arr.arrivingAt).getTime() : 0
      const depTime = dep.departingAt ? new Date(dep.departingAt).getTime() : 0
      const layoverMinutes =
        arrTime && depTime ? Math.round((depTime - arrTime) / 60000) : 0
      out.push({
        sliceIndex,
        stopIndex: i + 1,
        airportCode: dest?.iataCode ?? "",
        airportName: dest?.name ?? dest?.iataCode ?? "—",
        layoverMinutes,
      })
    }
  })
  return out
}

export function formatLayover(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function durationToMinutes(d: string): number {
  const h = d.match(/(\d+)h/)?.[1]
  const m = d.match(/(\d+)m/)?.[1]
  return parseInt(h ?? "0", 10) * 60 + parseInt(m ?? "0", 10)
}
