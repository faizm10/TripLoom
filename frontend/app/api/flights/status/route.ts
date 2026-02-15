import { NextResponse } from "next/server"

const AVIATIONSTACK_BASE =
  process.env.FLIGHT_STATUS_BASE_URL || "https://api.aviationstack.com/v1"
const AEROAPI_BASE = process.env.AEROAPI_BASE_URL || "https://aeroapi.flightaware.com/aeroapi"

type AviationNode = {
  airport?: string
  iata?: string
  scheduled?: string
  timezone?: string
  terminal?: string
  gate?: string
}

type AviationRow = {
  flight_date?: string
  airline?: { name?: string; iata?: string }
  flight?: { iata?: string; number?: string; stops?: number | null; estimated_runtime?: number | null }
  departure?: AviationNode
  arrival?: AviationNode
}

type AviationResponse = {
  data?: AviationRow[]
  error?: { message?: string; code?: string | number }
}

type AeroFlight = {
  ident?: string
  ident_iata?: string
  operator?: string
  operator_iata?: string
  origin?: {
    code_iata?: string
    code?: string
    iata?: string
    name?: string
    timezone?: string
  }
  destination?: {
    code_iata?: string
    code?: string
    iata?: string
    name?: string
    timezone?: string
  }
  origin_iata?: string
  destination_iata?: string
  origin_name?: string
  destination_name?: string
  scheduled_out?: string
  scheduled_in?: string
  departure_time?: string
  arrival_time?: string
  actual_off?: string
  actual_on?: string
  estimated_out?: string
  estimated_in?: string
  filed_ete?: string
  route_distance?: number
  terminal_origin?: string
  gate_origin?: string
  terminal_destination?: string
  gate_destination?: string
  number_of_stops?: number
  stops?: number
}

type AeroResponse = {
  flights?: AeroFlight[]
  links?: unknown
}

type AeroSchedule = {
  ident?: string
  ident_iata?: string
  actual_ident?: string
  actual_ident_iata?: string
  origin_iata?: string
  destination_iata?: string
  scheduled_out?: string
  scheduled_in?: string
}

type AeroSchedulesResponse = {
  scheduled?: AeroSchedule[]
  links?: unknown
}

function normalizeFlightNumber(v: string): string {
  return v.replace(/\s+/g, "").toUpperCase()
}

function toTimeLabel(iso: string | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function durationLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—"
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function filedEteToMinutes(v: string | undefined): number {
  if (!v) return 0
  const m = v.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!m) return 0
  return Number(m[1]) * 60 + Number(m[2])
}

function deriveDurationMinutes(row: AviationRow): number {
  const runtime = Number(row.flight?.estimated_runtime ?? 0)
  if (runtime > 0) return runtime
  const dep = row.departure?.scheduled ? new Date(row.departure.scheduled).getTime() : NaN
  const arr = row.arrival?.scheduled ? new Date(row.arrival.scheduled).getTime() : NaN
  if (Number.isFinite(dep) && Number.isFinite(arr) && arr > dep) {
    return Math.round((arr - dep) / 60000)
  }
  return 0
}

function deriveAeroDurationMinutes(row: AeroFlight): number {
  const fromFiled = filedEteToMinutes(row.filed_ete)
  if (fromFiled > 0) return fromFiled
  const depRaw = row.scheduled_out || row.departure_time || row.estimated_out || row.actual_off
  const arrRaw = row.scheduled_in || row.arrival_time || row.estimated_in || row.actual_on
  const dep = depRaw ? new Date(depRaw).getTime() : NaN
  const arr = arrRaw ? new Date(arrRaw).getTime() : NaN
  if (Number.isFinite(dep) && Number.isFinite(arr) && arr > dep) {
    return Math.round((arr - dep) / 60000)
  }
  return 0
}

function airlineCodeFromFlight(flightNumber: string): string {
  const m = normalizeFlightNumber(flightNumber).match(/^([A-Z0-9]{2,3})/)
  return m?.[1] ?? ""
}

function airportIata(value?: { code_iata?: string; iata?: string; code?: string }): string {
  return (value?.code_iata || value?.iata || value?.code || "").toUpperCase()
}

function addOneDayIsoDate(yyyyMmDd: string): string {
  const d = new Date(`${yyyyMmDd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function daysAheadFromToday(yyyyMmDd: string): number {
  const target = new Date(`${yyyyMmDd}T00:00:00Z`).getTime()
  const now = new Date()
  const todayUtcStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((target - todayUtcStart) / 86400000)
}

function splitCarrierAndFlightNumber(flightNumber: string): { carrier: string; number: string } {
  const normalized = normalizeFlightNumber(flightNumber)
  const m = normalized.match(/^([A-Z0-9]{2,3})(\d{1,4}[A-Z]?)$/)
  if (!m) return { carrier: "", number: "" }
  return { carrier: m[1], number: m[2] }
}

function pickBestFlight(rows: AviationRow[], flightNumber: string, departureDate: string): AviationRow | null {
  const normalized = normalizeFlightNumber(flightNumber)
  const exact = rows.filter((r) => {
    const iata = normalizeFlightNumber(r.flight?.iata ?? "")
    return iata === normalized && (r.flight_date ?? "") === departureDate
  })
  const candidates = exact.length > 0 ? exact : rows
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => {
    const ta = a.departure?.scheduled ? new Date(a.departure.scheduled).getTime() : Number.MAX_SAFE_INTEGER
    const tb = b.departure?.scheduled ? new Date(b.departure.scheduled).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })[0]
}

function pickBestAeroFlight(rows: AeroFlight[], flightNumber: string): AeroFlight | null {
  const normalized = normalizeFlightNumber(flightNumber)
  if (rows.length === 0) return null
  const exact = rows.filter((r) => {
    const iata = normalizeFlightNumber(r.ident_iata || "")
    const ident = normalizeFlightNumber(r.ident || "")
    return iata === normalized || ident === normalized
  })
  const candidates = exact.length > 0 ? exact : rows
  return [...candidates].sort((a, b) => {
    const taRaw = a.scheduled_out || a.departure_time || a.estimated_out || a.actual_off
    const tbRaw = b.scheduled_out || b.departure_time || b.estimated_out || b.actual_off
    const ta = taRaw ? new Date(taRaw).getTime() : Number.MAX_SAFE_INTEGER
    const tb = tbRaw ? new Date(tbRaw).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })[0]
}

function pickBestAeroSchedule(rows: AeroSchedule[], flightNumber: string): AeroSchedule | null {
  const normalized = normalizeFlightNumber(flightNumber)
  if (rows.length === 0) return null
  const exactIata = rows.filter(
    (r) => normalizeFlightNumber(r.ident_iata || "") === normalized
  )
  const exactActual = rows.filter(
    (r) => normalizeFlightNumber(r.actual_ident_iata || "") === normalized
  )
  const candidates = exactIata.length > 0 ? exactIata : exactActual.length > 0 ? exactActual : rows
  return [...candidates].sort((a, b) => {
    const ta = a.scheduled_out ? new Date(a.scheduled_out).getTime() : Number.MAX_SAFE_INTEGER
    const tb = b.scheduled_out ? new Date(b.scheduled_out).getTime() : Number.MAX_SAFE_INTEGER
    return ta - tb
  })[0]
}

export async function POST(request: Request) {
  const aeroApiKey = process.env.AERO_API_KEY || process.env.AEROAPI_KEY
  const accessKey =
    process.env.FLIGHT_STATUS_API_KEY ||
    process.env.AVIATIONSTACK_API_KEY ||
    process.env.AVIATIONSTACK_ACCESS_KEY
  const diagnostics = {
    aeroConfigured: Boolean(aeroApiKey),
    aviationConfigured: Boolean(accessKey),
  }

  if (!aeroApiKey && !accessKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Flight status API unavailable. Set AERO_API_KEY or FLIGHT_STATUS_API_KEY.",
        diagnostics,
      },
      { status: 503 }
    )
  }

  let body: { flight_number?: string; departure_date?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 })
  }

  const flightNumber = normalizeFlightNumber(body.flight_number ?? "")
  const departureDate = (body.departure_date ?? "").trim()
  if (!flightNumber) {
    return NextResponse.json({ ok: false, error: "flight_number is required." }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    return NextResponse.json(
      { ok: false, error: "departure_date must be YYYY-MM-DD." },
      { status: 400 }
    )
  }
  const aheadDays = daysAheadFromToday(departureDate)
  if (aheadDays > 366) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "That date is too far ahead. Flight lookup currently supports up to about 12 months in advance.",
      },
      { status: 400 }
    )
  }

  try {
    const lookupFromSchedules = async () => {
      if (!aeroApiKey) return null
      const { carrier, number } = splitCarrierAndFlightNumber(flightNumber)
      if (!carrier || !number) return null
      const schedParams = new URLSearchParams({
        airline: carrier,
        flight_number: number,
        max_pages: "1",
      })
      const endDate = addOneDayIsoDate(departureDate)
      const schedRes = await fetch(
        `${AEROAPI_BASE}/schedules/${departureDate}/${endDate}?${schedParams.toString()}`,
        {
          cache: "no-store",
          headers: { "x-apikey": aeroApiKey },
        }
      )
      const schedData = (await schedRes.json().catch(() => null)) as AeroSchedulesResponse | null
      if (!schedRes.ok || !(schedData?.scheduled?.length)) return null
      const best = pickBestAeroSchedule(schedData.scheduled, flightNumber)
      if (!best) return null
      const operatorCode = airlineCodeFromFlight(best.ident_iata || best.ident || flightNumber)
      return {
        ok: true as const,
        flight: {
          flightNumber: best.ident_iata || best.ident || flightNumber,
          airline: operatorCode || "Airline",
          airlineLogoUrl: operatorCode
            ? `https://www.gstatic.com/flights/airline_logos/70px/${encodeURIComponent(
                operatorCode
              )}.png`
            : undefined,
          routeFrom: (best.origin_iata || "").toUpperCase(),
          routeTo: (best.destination_iata || "").toUpperCase(),
          departureAirportName: "",
          arrivalAirportName: "",
          departureLocal: toTimeLabel(best.scheduled_out),
          arrivalLocal: toTimeLabel(best.scheduled_in),
          departureTimezone: "",
          arrivalTimezone: "",
          duration: durationLabel(
            (() => {
              const dep = best.scheduled_out ? new Date(best.scheduled_out).getTime() : NaN
              const arr = best.scheduled_in ? new Date(best.scheduled_in).getTime() : NaN
              if (Number.isFinite(dep) && Number.isFinite(arr) && arr > dep) {
                return Math.round((arr - dep) / 60000)
              }
              return 0
            })()
          ),
          terminalGate: undefined,
          stops: 0,
        },
      }
    }

    const farFuture = aheadDays > 2
    let scheduleLookupAttempted = false

    if (farFuture) {
      scheduleLookupAttempted = true
      const scheduleOnly = await lookupFromSchedules()
      if (scheduleOnly) return NextResponse.json(scheduleOnly)
    }

    if (aeroApiKey) {
      const startIso = `${departureDate}T00:00:00Z`
      const endDate = new Date(`${departureDate}T00:00:00Z`)
      endDate.setUTCDate(endDate.getUTCDate() + 1)
      const endIso = endDate.toISOString().slice(0, 19) + "Z"
      const aeroParams = new URLSearchParams({
        start: startIso,
        end: endIso,
      })

      const aeroRes = await fetch(
        `${AEROAPI_BASE}/flights/${encodeURIComponent(flightNumber)}?${aeroParams.toString()}`,
        {
          cache: "no-store",
          headers: {
            "x-apikey": aeroApiKey,
          },
        }
      )
      const aeroData = (await aeroRes.json().catch(() => null)) as AeroResponse | null
      if (aeroRes.ok && (aeroData?.flights?.length ?? 0) > 0) {
        const best = pickBestAeroFlight(aeroData?.flights ?? [], flightNumber)
        if (best) {
          const depCode = airportIata(best.origin) || (best.origin_iata || "").toUpperCase()
          const arrCode =
            airportIata(best.destination) || (best.destination_iata || "").toUpperCase()
          const depName = best.origin?.name || best.origin_name || ""
          const arrName = best.destination?.name || best.destination_name || ""
          const depRaw =
            best.scheduled_out || best.departure_time || best.estimated_out || best.actual_off
          const arrRaw =
            best.scheduled_in || best.arrival_time || best.estimated_in || best.actual_on
          const depT = best.terminal_origin
            ? `Dep T${best.terminal_origin}${best.gate_origin ? ` G${best.gate_origin}` : ""}`
            : best.gate_origin
              ? `Dep G${best.gate_origin}`
              : ""
          const arrT = best.terminal_destination
            ? `Arr T${best.terminal_destination}${best.gate_destination ? ` G${best.gate_destination}` : ""}`
            : best.gate_destination
              ? `Arr G${best.gate_destination}`
              : ""
          const terminalGate = [depT, arrT].filter(Boolean).join(" · ") || undefined
          const operatorCode =
            (best.operator_iata || airlineCodeFromFlight(best.ident_iata || best.ident || flightNumber)).toUpperCase()

          return NextResponse.json({
            ok: true,
            flight: {
              flightNumber: best.ident_iata || best.ident || flightNumber,
              airline: best.operator || operatorCode || "Airline",
              airlineLogoUrl: operatorCode
                ? `https://www.gstatic.com/flights/airline_logos/70px/${encodeURIComponent(
                    operatorCode
                  )}.png`
                : undefined,
              routeFrom: depCode,
              routeTo: arrCode,
              departureAirportName: depName,
              arrivalAirportName: arrName,
              departureLocal: toTimeLabel(depRaw),
              arrivalLocal: toTimeLabel(arrRaw),
              departureTimezone: best.origin?.timezone || "",
              arrivalTimezone: best.destination?.timezone || "",
              duration: durationLabel(deriveAeroDurationMinutes(best)),
              terminalGate,
              stops: Math.max(0, Number(best.number_of_stops ?? best.stops ?? 0) || 0),
            },
          })
        }
      }
      if (!scheduleLookupAttempted) {
        scheduleLookupAttempted = true
        const fromSchedules = await lookupFromSchedules()
        if (fromSchedules) return NextResponse.json(fromSchedules)
      }
      // fall through to aviationstack fallback if AeroAPI did not return a usable result
    }

    if (!accessKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "No flight found for that number and date.",
          diagnostics: {
            ...diagnostics,
            scheduleLookupAttempted,
            hint:
              "Aero schedules lookup returned no match. Ensure AERO_API_KEY is loaded in this Next.js process and restart dev server after env changes.",
          },
        },
        { status: 404 }
      )
    }

    const params = new URLSearchParams({
      access_key: accessKey,
      flight_iata: flightNumber,
      flight_date: departureDate,
      limit: "20",
    })

    const res = await fetch(`${AVIATIONSTACK_BASE}/flights?${params.toString()}`, {
      cache: "no-store",
    })
    const data = (await res.json().catch(() => null)) as AviationResponse | null

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error?.message ?? `Flight status API error: ${res.status}` },
        { status: res.status >= 500 ? 502 : 400 }
      )
    }
    if (!data?.data?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No flight found for that number and date.",
          diagnostics: {
            ...diagnostics,
            scheduleLookupAttempted,
          },
        },
        { status: 404 }
      )
    }

    const best = pickBestFlight(data.data, flightNumber, departureDate)
    if (!best) {
      return NextResponse.json(
        {
          ok: false,
          error: "No flight found for that number and date.",
          diagnostics: {
            ...diagnostics,
            scheduleLookupAttempted,
          },
        },
        { status: 404 }
      )
    }

    const dep = best.departure ?? {}
    const arr = best.arrival ?? {}
    const airlineCode = (best.airline?.iata || airlineCodeFromFlight(flightNumber)).toUpperCase()
    const depT = dep.terminal ? `Dep T${dep.terminal}${dep.gate ? ` G${dep.gate}` : ""}` : dep.gate ? `Dep G${dep.gate}` : ""
    const arrT = arr.terminal ? `Arr T${arr.terminal}${arr.gate ? ` G${arr.gate}` : ""}` : arr.gate ? `Arr G${arr.gate}` : ""
    const terminalGate = [depT, arrT].filter(Boolean).join(" · ") || undefined

    return NextResponse.json({
      ok: true,
      flight: {
        flightNumber: best.flight?.iata || flightNumber,
        airline: best.airline?.name || airlineCode || "Airline",
        airlineLogoUrl: airlineCode
          ? `https://www.gstatic.com/flights/airline_logos/70px/${encodeURIComponent(
              airlineCode
            )}.png`
          : undefined,
        routeFrom: (dep.iata || "").toUpperCase(),
        routeTo: (arr.iata || "").toUpperCase(),
        departureAirportName: dep.airport || "",
        arrivalAirportName: arr.airport || "",
        departureLocal: toTimeLabel(dep.scheduled),
        arrivalLocal: toTimeLabel(arr.scheduled),
        departureTimezone: dep.timezone || "",
        arrivalTimezone: arr.timezone || "",
        duration: durationLabel(deriveDurationMinutes(best)),
        terminalGate,
        stops: Math.max(0, Number(best.flight?.stops ?? 0) || 0),
      },
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to lookup flight status.",
      },
      { status: 500 }
    )
  }
}
