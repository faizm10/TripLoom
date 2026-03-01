"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import {
  ArrowDownIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  Loader2Icon,
  PlaneIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { useTripPage } from "@/components/trips/trip-shell"
import {
  DestinationSearch,
  type DestinationSuggestion,
} from "@/components/dashboard-home/destination-search"
import type { Trip } from "@/lib/trips"
import {
  getTripFlightsFromSupabase,
  saveTripFlightToSupabase,
} from "@/lib/supabase-trip-flights"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FlightOffer } from "@/lib/flights"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import {
  type Place,
  type TripType,
  type Leg,
  type SavedFlightChoice,
  type ManualSortKey,
  type InboundLookupDraft,
  type InboundFlightEntry,
  type InboundStopDetail,
  formatTime,
  formatDate,
  getOfferRow,
  getStopsLabel,
  getStopsCount,
  getStopDetails,
  formatLayover,
  durationToMinutes,
  MIN_DATE,
  SortableTh,
  SavedFlightsCard,
} from "./flights"

const minDate = MIN_DATE

export function FlightsPageContent({ trip: tripProp }: { trip: Trip }) {
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp

  // ——— Search form state ———
  const [tripType, setTripType] = useState<TripType>("round_trip")
  const [origin, setOrigin] = useState<Place | null>(null)
  const [destination, setDestination] = useState<Place | null>(null)
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [legs, setLegs] = useState<Leg[]>([
    { origin: null, destination: null, date: "" },
  ])
  const [adults, setAdults] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<FlightOffer[]>([])
  const [searched, setSearched] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [manualSortBy, setManualSortBy] = useState<ManualSortKey | null>("cost")
  const [manualSortDir, setManualSortDir] = useState<"asc" | "desc">("asc")
  const [manualFilterAirline, setManualFilterAirline] = useState("")
  const [manualFilterMaxPrice, setManualFilterMaxPrice] = useState("")
  const [mounted, setMounted] = useState(false)
  const [expandedManualOfferIds, setExpandedManualOfferIds] = useState<Set<string>>(new Set())

  // ——— Round-trip (SerpAPI two-step) state ———
  const [selectedOutboundOfferId, setSelectedOutboundOfferId] = useState<string | null>(null)
  const [returnOffers, setReturnOffers] = useState<FlightOffer[]>([])
  const [returnLoading, setReturnLoading] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [selectedReturnOfferId, setSelectedReturnOfferId] = useState<string | null>(null)
  const [expandedReturnOfferIds, setExpandedReturnOfferIds] = useState<Set<string>>(new Set())
  const [flightStepTab, setFlightStepTab] = useState<"outbound" | "return" | "summary">("outbound")

  // ——— Saved flights & edit state ———
  const [savedFlights, setSavedFlights] = useState<SavedFlightChoice[]>([])
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null)
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null)
  const [editingDate, setEditingDate] = useState("")

  // ——— Inbound lookup state ———
  const [lookupFlightNumber, setLookupFlightNumber] = useState("")
  const [lookupDate, setLookupDate] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupDraft, setLookupDraft] = useState<InboundLookupDraft | null>(null)
  const [lookupEditMode, setLookupEditMode] = useState(false)
  const [inboundEntries, setInboundEntries] = useState<InboundFlightEntry[]>([])

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!trip.id) return
    getTripFlightsFromSupabase(trip.id)
      .then((list) => setSavedFlights(list))
      .catch(() => {})
  }, [trip.id])

  const toggleManualExpanded = (offerId: string) => {
    setExpandedManualOfferIds((prev) => {
      const next = new Set(prev)
      if (next.has(offerId)) next.delete(offerId)
      else next.add(offerId)
      return next
    })
  }
  const toggleReturnExpanded = (offerId: string) => {
    setExpandedReturnOfferIds((prev) => {
      const next = new Set(prev)
      if (next.has(offerId)) next.delete(offerId)
      else next.add(offerId)
      return next
    })
  }

  const isSerpRoundTripTwoStep =
    tripType === "round_trip" &&
    returnDate.trim() !== ""

  const selectedOutboundOffer =
    selectedOutboundOfferId != null
      ? offers.find((o) => o.id === selectedOutboundOfferId)
      : null
  const selectedReturnOffer =
    selectedReturnOfferId != null
      ? returnOffers.find((o) => o.id === selectedReturnOfferId)
      : null
  const offerForBook =
    isSerpRoundTripTwoStep && selectedReturnOffer != null
      ? selectedReturnOffer
      : offers.find((o) => o.id === selectedOfferId) ?? null

  const fetchReturnFlights = async (outboundOffer: FlightOffer) => {
    const token = outboundOffer.departureToken
    if (!token || !origin?.iataCode || !destination?.iataCode || !departureDate.trim() || !returnDate.trim()) return
    setReturnLoading(true)
    setReturnError(null)
    setReturnOffers([])
    setSelectedReturnOfferId(null)
    try {
      const res = await fetch("/api/flights/serp/return-flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departure_token: token,
          outbound_date: departureDate.trim(),
          return_date: returnDate.trim(),
          departure_id: destination.iataCode,
          arrival_id: origin.iataCode,
          adults,
          outbound_offer_id: outboundOffer.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReturnError(data?.error ?? "Failed to load return flights")
        return
      }
      setReturnOffers(data?.offers ?? [])
    } catch (e) {
      setReturnError(e instanceof Error ? e.message : "Failed to load return flights")
    } finally {
      setReturnLoading(false)
    }
  }

  // When user opens Return tab, load return flights if we have a selected outbound and none loaded yet
  useEffect(() => {
    if (
      flightStepTab !== "return" ||
      !isSerpRoundTripTwoStep ||
      !selectedOutboundOffer ||
      returnLoading ||
      returnOffers.length > 0 ||
      returnError != null
    ) return
    fetchReturnFlights(selectedOutboundOffer)
  }, [flightStepTab, isSerpRoundTripTwoStep, selectedOutboundOffer?.id])

  useEffect(() => {
    if (!isSerpRoundTripTwoStep) setFlightStepTab("outbound")
  }, [isSerpRoundTripTwoStep])

  const setPlace =
    (setter: (p: Place | null) => void) =>
    (s: DestinationSuggestion) => {
      const code = s.iataCode ?? ""
      if (code) setter({ displayName: s.displayName, iataCode: code })
    }

  const buildSlices = (): { origin: string; destination: string; departure_date: string }[] => {
    if (tripType === "one_way") {
      if (!origin?.iataCode || !destination?.iataCode || !departureDate) return []
      return [{ origin: origin.iataCode, destination: destination.iataCode, departure_date: departureDate }]
    }
    if (tripType === "round_trip") {
      if (!origin?.iataCode || !destination?.iataCode || !departureDate || !returnDate) return []
      return [
        { origin: origin.iataCode, destination: destination.iataCode, departure_date: departureDate },
        { origin: destination.iataCode, destination: origin.iataCode, departure_date: returnDate },
      ]
    }
    return legs
      .filter((l) => l.origin?.iataCode && l.destination?.iataCode && l.date)
      .map((l) => ({
        origin: l.origin!.iataCode,
        destination: l.destination!.iataCode,
        departure_date: l.date,
      }))
  }

  const manualAirlines = useMemo(() => {
    const set = new Set<string>()
    offers.forEach((o) => {
      const n = o.owner?.name
      if (n) set.add(n)
    })
    return Array.from(set).sort()
  }, [offers])

  const manualFilteredAndSortedOffers = useMemo(() => {
    const seen = new Set<string>()
    let list = offers.filter((o) => {
      if (seen.has(o.id)) return false
      seen.add(o.id)
      return true
    })
    if (manualFilterAirline) {
      list = list.filter((o) => o.owner?.name === manualFilterAirline)
    }
    const maxP = manualFilterMaxPrice.trim()
    if (maxP !== "") {
      const num = Number(maxP)
      if (!Number.isNaN(num)) list = list.filter((o) => Number(o.totalAmount) <= num)
    }
    if (manualSortBy == null) return list
    const dir = manualSortDir === "asc" ? 1 : -1
    list.sort((a, b) => {
      const ra = getOfferRow(a)
      const rb = getOfferRow(b)
      let cmp = 0
      switch (manualSortBy) {
        case "route":
          cmp = (ra.route ?? "").localeCompare(rb.route ?? "")
          break
        case "date":
          cmp = (ra.dateStr ?? "").localeCompare(rb.dateStr ?? "")
          break
        case "departure":
          cmp = (ra.departure ?? "").localeCompare(rb.departure ?? "")
          break
        case "arrival":
          cmp = (ra.arrival ?? "").localeCompare(rb.arrival ?? "")
          break
        case "duration":
          cmp = durationToMinutes(ra.duration) - durationToMinutes(rb.duration)
          break
        case "stops":
          cmp = getStopsCount(a) - getStopsCount(b)
          break
        case "cost":
          cmp = Number(a.totalAmount) - Number(b.totalAmount)
          break
        case "airline":
          cmp = (a.owner?.name ?? "").localeCompare(b.owner?.name ?? "")
          break
        default:
          break
      }
      return cmp * dir
    })
    return list
  }, [offers, manualFilterAirline, manualFilterMaxPrice, manualSortBy, manualSortDir])


  const handleManualSort = (key: ManualSortKey) => {
    setManualSortBy((prev) => {
      if (prev === key) {
        setManualSortDir((d) => (d === "asc" ? "desc" : "asc"))
        return key
      }
      setManualSortDir("asc")
      return key
    })
  }


  const handleManualSearch = async () => {
    const slices = buildSlices()
    if (slices.length === 0) {
      if (!origin?.iataCode || !destination?.iataCode) {
        setError("Please select an origin and destination from the dropdown (city or airport) so we have valid codes for search.")
      } else {
        setError("Please fill all origin, destination, and date fields.")
      }
      return
    }
    setError(null)
    setLoading(true)
    setOffers([])
    setSearched(false)
    setSelectedOfferId(null)
    setSelectedOutboundOfferId(null)
    setReturnOffers([])
    setReturnError(null)
    setSelectedReturnOfferId(null)
    try {
      const useSerpApi = tripType !== "multi_city"
      const endpoint = useSerpApi ? "/api/flights/serp/search" : "/api/flights/serp/search"
      const payload: Record<string, unknown> = {
        slices,
        adults,
        cabin_class: "economy",
      }
      // SerpAPI round trip: send return_date so SerpAPI returns departure_token on each offer
      if (useSerpApi && tripType === "round_trip" && slices[1]) {
        payload.slices = [slices[0]]
        payload.return_date = slices[1].departure_date
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? "Search failed")
        return
      }
      setOffers(data?.offers ?? [])
      setSearched(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed")
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }


  const addLeg = () => {
    if (legs.length >= 6) return
    setLegs((prev) => [...prev, { origin: null, destination: null, date: "" }])
  }
  const removeLeg = (index: number) => {
    if (legs.length <= 1) return
    setLegs((prev) => prev.filter((_, i) => i !== index))
  }
  const updateLeg = (index: number, upd: Partial<Leg>) => {
    setLegs((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...upd } : l))
    )
  }

  const runInboundLookup = async () => {
    const flightNumber = lookupFlightNumber.trim().toUpperCase()
    const departureDate = lookupDate.trim()
    if (!flightNumber || !departureDate) {
      setLookupError("Enter flight number and departure date.")
      return
    }
    setLookupError(null)
    setLookupLoading(true)
    setLookupDraft(null)
    setLookupEditMode(false)
    try {
      const res = await fetch("/api/flights/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flight_number: flightNumber,
          departure_date: departureDate,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok || !data?.flight) {
        setLookupError(data?.error ?? "Unable to find flight.")
        return
      }
      setLookupDraft({
        ...data.flight,
        cost: "",
        stopDetails: [],
      } as InboundLookupDraft)
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Unable to find flight.")
    } finally {
      setLookupLoading(false)
    }
  }

  const updateLookupDraft = <K extends keyof InboundLookupDraft>(
    key: K,
    value: InboundLookupDraft[K]
  ) => {
    setLookupDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const addLookupStopDetail = () => {
    setLookupDraft((prev) =>
      prev ? { ...prev, stopDetails: [...prev.stopDetails, { airport: "", layover: "" }] } : prev
    )
  }

  const removeLookupStopDetail = (index: number) => {
    setLookupDraft((prev) =>
      prev
        ? { ...prev, stopDetails: prev.stopDetails.filter((_, i) => i !== index) }
        : prev
    )
  }

  const updateLookupStopDetail = (
    index: number,
    key: keyof InboundStopDetail,
    value: string
  ) => {
    setLookupDraft((prev) =>
      prev
        ? {
            ...prev,
            stopDetails: prev.stopDetails.map((row, i) =>
              i === index ? { ...row, [key]: value } : row
            ),
          }
        : prev
    )
  }

  const confirmLookupFlight = () => {
    if (!lookupDraft || !lookupDate) return
    const entry: InboundFlightEntry = {
      ...lookupDraft,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: lookupDate,
      stopDetails: lookupDraft.stopDetails
        .filter((s) => s.airport.trim() || s.layover.trim())
        .map((s) => ({ airport: s.airport.trim(), layover: s.layover.trim() })),
    }
    setInboundEntries((prev) => [entry, ...prev])
    setLookupDraft(null)
    setLookupEditMode(false)
    setLookupFlightNumber("")
    setLookupDate("")
    setLookupError(null)
  }

  const saveFlightChoice = (offer: FlightOffer, source: string) => {
    const row = getOfferRow(offer)
    const id = `${trip.id}:${source}:${offer.id}:${row.dateStr}`
    const entry: SavedFlightChoice = {
      id,
      source,
      route: row.route,
      date: row.dateStr,
      departure: row.departure,
      arrival: row.arrival,
      duration: row.duration,
      stops: getStopsLabel(offer),
      airline: offer.owner?.name ?? "Airline",
      cost: `${offer.totalAmount} ${offer.totalCurrency}`,
      bookUrl: offer.bookUrl ?? null,
    }
    setSavedFlights((prev) => {
      if (prev.some((x) => x.id === id)) return prev
      return [entry, ...prev]
    })
    setSaveConfirmation(`Saved ${source} flight.`)
    saveTripFlightToSupabase(trip.id, {
      ...entry,
      offerId: offer.id,
      bookUrl: offer.bookUrl,
    }).catch((e) => toast.error(e instanceof Error ? e.message : "Could not save flight to cloud."))
  }

  const saveRoundTripSelection = () => {
    if (!selectedOutboundOffer || !selectedReturnOffer) return
    const out = getOfferRow(selectedOutboundOffer)
    const ret = getOfferRow(selectedReturnOffer)
    const outId = `${trip.id}:outbound:${selectedOutboundOffer.id}:${out.dateStr}`
    const retId = `${trip.id}:inbound:${selectedReturnOffer.id}:${ret.dateStr}`
    const outEntry: SavedFlightChoice = {
      id: outId,
      source: "outbound",
      route: out.route,
      date: out.dateStr,
      departure: out.departure,
      arrival: out.arrival,
      duration: out.duration,
      stops: getStopsLabel(selectedOutboundOffer),
      airline: selectedOutboundOffer.owner?.name ?? "Airline",
      cost: `${selectedOutboundOffer.totalAmount} ${selectedOutboundOffer.totalCurrency}`,
      bookUrl: selectedOutboundOffer.bookUrl ?? null,
    }
    const retEntry: SavedFlightChoice = {
      id: retId,
      source: "inbound",
      route: ret.route,
      date: ret.dateStr,
      departure: ret.departure,
      arrival: ret.arrival,
      duration: ret.duration,
      stops: getStopsLabel(selectedReturnOffer),
      airline: selectedReturnOffer.owner?.name ?? "Airline",
      cost: `${selectedReturnOffer.totalAmount} ${selectedReturnOffer.totalCurrency}`,
      bookUrl: selectedReturnOffer.bookUrl ?? null,
    }
    setSavedFlights((prev) => {
      const next = [...prev]
      if (!next.some((x) => x.id === outId)) next.unshift(outEntry)
      if (!next.some((x) => x.id === retId)) next.unshift(retEntry)
      return next
    })
    setSaveConfirmation("Saved outbound and inbound flights.")
    const persist = () => {
      saveTripFlightToSupabase(trip.id, { ...outEntry, offerId: selectedOutboundOffer.id, bookUrl: selectedOutboundOffer.bookUrl }).catch((e) =>
        toast.error(e instanceof Error ? e.message : "Could not save flight to cloud.")
      )
      saveTripFlightToSupabase(trip.id, { ...retEntry, offerId: selectedReturnOffer.id, bookUrl: selectedReturnOffer.bookUrl }).catch((e) =>
        toast.error(e instanceof Error ? e.message : "Could not save flight to cloud.")
      )
    }
    persist()
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-input h-9 w-48 animate-pulse rounded-none border bg-muted/50" />
          <div className="border-input h-9 w-24 animate-pulse rounded-none border bg-muted/50" />
        </div>
        <div className="min-h-[320px] rounded-none border border-border bg-muted/20" />
      </div>
    )
  }

  const showLegacyFlightSearch = true
  if (!showLegacyFlightSearch) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              Search Modes Coming Soon
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Manual Search and Explore are temporarily hidden while we finish the next iteration.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlaneIcon className="size-4" />
              Inbound Flight Lookup
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Enter flight number and departure date. We will auto-fill route, local times, timezone, airline, duration, and terminal/gate when available.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Flight number</Label>
                <input
                  type="text"
                  value={lookupFlightNumber}
                  onChange={(e) => setLookupFlightNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AC123"
                  className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label>Departure date</Label>
                <input
                  type="date"
                  value={lookupDate}
                  onChange={(e) => setLookupDate(e.target.value)}
                  className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="rounded-none" onClick={runInboundLookup} disabled={lookupLoading}>
                {lookupLoading ? "Looking up..." : "Lookup flight"}
              </Button>
            </div>

            {lookupError && (
              <p className="rounded-none border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                {lookupError}
              </p>
            )}

            {lookupDraft && (
              <div className="space-y-3 border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">
                      Found: {lookupDraft.airline} {lookupDraft.flightNumber} — {lookupDraft.departureAirportName || lookupDraft.routeFrom} ({lookupDraft.routeFrom}) {lookupDraft.departureLocal} → {lookupDraft.arrivalAirportName || lookupDraft.routeTo} ({lookupDraft.routeTo}) {lookupDraft.arrivalLocal}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {lookupDraft.departureTimezone ? `${lookupDraft.departureTimezone}` : "Local"} → {lookupDraft.arrivalTimezone ? `${lookupDraft.arrivalTimezone}` : "Local"} · {lookupDraft.duration} · {lookupDraft.stops} {lookupDraft.stops === 1 ? "stop" : "stops"}{lookupDraft.terminalGate ? ` · ${lookupDraft.terminalGate}` : ""}
                    </p>
                  </div>
                  {lookupDraft.airlineLogoUrl && (
                    <div
                      aria-label={`${lookupDraft.airline} logo`}
                      role="img"
                      className="h-8 w-8 rounded-none border border-border bg-background bg-contain bg-center bg-no-repeat p-1"
                      style={{ backgroundImage: `url(${lookupDraft.airlineLogoUrl})` }}
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-none" onClick={confirmLookupFlight}>
                    Confirm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none"
                    onClick={() => setLookupEditMode((v) => !v)}
                  >
                    {lookupEditMode ? "Close edit" : "Edit"}
                  </Button>
                </div>

                {lookupEditMode && (
                  <div className="space-y-3 border border-border p-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1">
                        <Label>Airline</Label>
                        <input
                          type="text"
                          value={lookupDraft.airline}
                          onChange={(e) => updateLookupDraft("airline", e.target.value)}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>From (IATA)</Label>
                        <input
                          type="text"
                          value={lookupDraft.routeFrom}
                          onChange={(e) => updateLookupDraft("routeFrom", e.target.value.toUpperCase())}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>To (IATA)</Label>
                        <input
                          type="text"
                          value={lookupDraft.routeTo}
                          onChange={(e) => updateLookupDraft("routeTo", e.target.value.toUpperCase())}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Departure (local)</Label>
                        <input
                          type="text"
                          value={lookupDraft.departureLocal}
                          onChange={(e) => updateLookupDraft("departureLocal", e.target.value)}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Arrival (local)</Label>
                        <input
                          type="text"
                          value={lookupDraft.arrivalLocal}
                          onChange={(e) => updateLookupDraft("arrivalLocal", e.target.value)}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Duration</Label>
                        <input
                          type="text"
                          value={lookupDraft.duration}
                          onChange={(e) => updateLookupDraft("duration", e.target.value)}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Terminal / gate</Label>
                        <input
                          type="text"
                          value={lookupDraft.terminalGate ?? ""}
                          onChange={(e) => updateLookupDraft("terminalGate", e.target.value)}
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Stops</Label>
                        <input
                          type="number"
                          min={0}
                          value={lookupDraft.stops}
                          onChange={(e) =>
                            updateLookupDraft("stops", Math.max(0, Number(e.target.value) || 0))
                          }
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Cost (USD)</Label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={lookupDraft.cost}
                          onChange={(e) => updateLookupDraft("cost", e.target.value)}
                          placeholder="optional"
                          className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>

                    {lookupDraft.stops > 0 && (
                      <div className="space-y-3 border border-border p-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Stop Details and Layovers</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-none"
                            onClick={addLookupStopDetail}
                          >
                            <PlusIcon className="size-3.5" />
                            Add stop
                          </Button>
                        </div>
                        {lookupDraft.stopDetails.map((row, index) => (
                          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                            <input
                              type="text"
                              value={row.airport}
                              onChange={(e) =>
                                updateLookupStopDetail(index, "airport", e.target.value)
                              }
                              placeholder="Stop airport"
                              className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                            />
                            <input
                              type="text"
                              value={row.layover}
                              onChange={(e) =>
                                updateLookupStopDetail(index, "layover", e.target.value)
                              }
                              placeholder="Layover (e.g. 1h 20m)"
                              className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-none"
                              onClick={() => removeLookupStopDetail(index)}
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {inboundEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Inbound Flights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inboundEntries.map((entry) => (
                <div key={entry.id} className="space-y-2 border border-border p-3">
                  <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <p><span className="font-medium">Flight:</span> {entry.flightNumber}</p>
                    <p><span className="font-medium">Airline:</span> {entry.airline}</p>
                    <p><span className="font-medium">Date:</span> {entry.date}</p>
                    <p><span className="font-medium">Route:</span> {entry.routeFrom} → {entry.routeTo}</p>
                    <p><span className="font-medium">Departure:</span> {entry.departureLocal}</p>
                    <p><span className="font-medium">Arrival:</span> {entry.arrivalLocal}</p>
                    <p><span className="font-medium">Duration:</span> {entry.duration}</p>
                    <p><span className="font-medium">Stops:</span> {entry.stops}</p>
                    <p><span className="font-medium">Cost:</span> {entry.cost ? `$${entry.cost}` : "—"}</p>
                    <p><span className="font-medium">Terminal/Gate:</span> {entry.terminalGate || "—"}</p>
                  </div>
                  {entry.stopDetails.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Stop / Layover Details</p>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        {entry.stopDetails.map((s, i) => (
                          <li key={i}>
                            Stop {i + 1}: {s.airport || "—"} · Layover: {s.layover || "—"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SavedFlightsCard
        tripId={trip.id}
        flights={savedFlights}
        editingFlightId={editingFlightId}
        editingDate={editingDate}
        onFlightsChange={setSavedFlights}
        onEditingFlightIdChange={setEditingFlightId}
        onEditingDateChange={setEditingDate}
      />

      {/* Manual search header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-medium">
            <SearchIcon className="size-3.5" />
            Manual search
          </div>
        </div>

        <div className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlaneIcon className="size-4" />
                Manual flight search
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                One way, round trip, or multi city for {trip.destination}. Select an offer and save your preferred options.
              </p>
              {tripType === "multi_city" && (
                <p className="text-muted-foreground text-xs">
                  Multi-city search uses the first leg only.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["one_way", "round_trip", "multi_city"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={tripType === t ? "default" : "outline"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setTripType(t)}
                  >
                    {t === "one_way" && "One way"}
                    {t === "round_trip" && "Round trip"}
                    {t === "multi_city" && "Multi city"}
                  </Button>
                ))}
              </div>

              {tripType === "one_way" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <DestinationSearch
                      airportsOnly
                      placeholder="Airport"
                      value={origin?.displayName}
                      onChange={(v) =>
                        setOrigin((prev) => (prev ? { ...prev, displayName: v } : null))
                      }
                      onSelect={((s: DestinationSuggestion) =>
                        setPlace(setOrigin)(s)) as (suggestion: DestinationSuggestion) => void}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <DestinationSearch
                      airportsOnly
                      placeholder="Airport"
                      value={destination?.displayName}
                      onChange={(v) =>
                        setDestination((prev) =>
                          prev ? { ...prev, displayName: v } : null
                        )
                      }
                      onSelect={((s: DestinationSuggestion) =>
                        setPlace(setDestination)(s)) as (suggestion: DestinationSuggestion) => void}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departure date</Label>
                    <input
                      type="date"
                      min={minDate}
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passengers</Label>
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "adult" : "adults"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tripType === "round_trip" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <DestinationSearch
                      airportsOnly
                      placeholder="Airport"
                      value={origin?.displayName}
                      onChange={(v) =>
                        setOrigin((prev) => (prev ? { ...prev, displayName: v } : null))
                      }
                      onSelect={((s: DestinationSuggestion) =>
                        setPlace(setOrigin)(s)) as (suggestion: DestinationSuggestion) => void}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <DestinationSearch
                      airportsOnly
                      placeholder="Airport"
                      value={destination?.displayName}
                      onChange={(v) =>
                        setDestination((prev) =>
                          prev ? { ...prev, displayName: v } : null
                        )
                      }
                      onSelect={((s: DestinationSuggestion) =>
                        setPlace(setDestination)(s)) as (suggestion: DestinationSuggestion) => void}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outbound date</Label>
                    <input
                      type="date"
                      min={minDate}
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Return date</Label>
                    <input
                      type="date"
                      min={departureDate || minDate}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passengers</Label>
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "adult" : "adults"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tripType === "multi_city" && (
                <div className="space-y-4">
                  {legs.map((leg, index) => (
                    <div
                      key={index}
                      className="border-input flex flex-wrap items-end gap-3 rounded-none border p-3"
                    >
                      <span className="text-muted-foreground w-6 text-xs font-medium">
                        {index + 1}.
                      </span>
                      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-[11px]">From</Label>
                          <DestinationSearch
                            airportsOnly
                            placeholder="Airport"
                            value={leg.origin?.displayName}
                            onChange={(v) =>
                              updateLeg(index, {
                                origin: leg.origin
                                  ? { ...leg.origin, displayName: v }
                                  : null,
                              })
                            }
                            onSelect={((s: DestinationSuggestion) => {
                              const code = s.iataCode ?? ""
                              if (code)
                                updateLeg(index, {
                                  origin: { displayName: s.displayName, iataCode: code },
                                })
                            }) as (suggestion: DestinationSuggestion) => void}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">To</Label>
                          <DestinationSearch
                            airportsOnly
                            placeholder="Airport"
                            value={leg.destination?.displayName}
                            onChange={(v) =>
                              updateLeg(index, {
                                destination: leg.destination
                                  ? { ...leg.destination, displayName: v }
                                  : null,
                              })
                            }
                            onSelect={((s: DestinationSuggestion) => {
                              const code = s.iataCode ?? ""
                              if (code)
                                updateLeg(index, {
                                  destination: {
                                    displayName: s.displayName,
                                    iataCode: code,
                                  },
                                })
                            }) as (suggestion: DestinationSuggestion) => void}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Date</Label>
                          <input
                            type="date"
                            min={minDate}
                            value={leg.date}
                            onChange={(e) => updateLeg(index, { date: e.target.value })}
                            className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-none"
                        onClick={() => removeLeg(index)}
                        disabled={legs.length <= 1}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {legs.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      onClick={addLeg}
                    >
                      <PlusIcon className="size-3.5" />
                      Add leg
                    </Button>
                  )}
                  <div className="w-24 space-y-2">
                    <Label>Passengers</Label>
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "adult" : "adults"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-destructive text-xs" role="alert">
                  {error}
                </p>
              )}
              <Button onClick={handleManualSearch} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <PlaneIcon className="size-4" />
                    Search flights
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {offers.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">
                {isSerpRoundTripTwoStep ? "Outbound flights" : "Results"}
                {tripType === "one_way" &&
                  `: ${origin?.displayName ?? origin?.iataCode} → ${destination?.displayName ?? destination?.iataCode}`}
                {tripType === "round_trip" && !isSerpRoundTripTwoStep &&
                  `: ${origin?.displayName ?? origin?.iataCode} ↔ ${destination?.displayName ?? destination?.iataCode}`}
                {isSerpRoundTripTwoStep &&
                  `: ${origin?.displayName ?? origin?.iataCode} → ${destination?.displayName ?? destination?.iataCode}`}
              </h2>
              {isSerpRoundTripTwoStep && (
                <p className="text-muted-foreground text-xs">
                  Step 1: select outbound. Step 2: select inbound. Step 3: confirm save.
                </p>
              )}
              {saveConfirmation && (
                <p className="rounded-none border border-primary/30 bg-primary/10 p-2 text-xs text-primary">
                  {saveConfirmation}
                </p>
              )}
              <div className="border-border flex flex-wrap items-center gap-3 rounded-none border bg-muted/30 p-3">
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <FilterIcon className="size-3.5" />
                  Filters
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs">Airline</Label>
                  <select
                    value={manualFilterAirline}
                    onChange={(e) => setManualFilterAirline(e.target.value)}
                    className="border-input bg-background h-8 min-w-[120px] rounded-none border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">All</option>
                    {manualAirlines.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs">Max price</Label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="No limit"
                    value={manualFilterMaxPrice}
                    onChange={(e) => setManualFilterMaxPrice(e.target.value)}
                    className="border-input bg-background h-8 w-24 rounded-none border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              {isSerpRoundTripTwoStep ? (
                <Tabs
                  value={flightStepTab}
                  onValueChange={(v) =>
                    setFlightStepTab(v as "outbound" | "return" | "summary")
                  }
                >
                  <TabsList className="mb-3 w-full max-w-sm">
                    <TabsTrigger value="outbound" className="rounded-none">
                      Outbound
                    </TabsTrigger>
                    <TabsTrigger
                      value="return"
                      disabled={!selectedOutboundOffer}
                      className="rounded-none"
                    >
                      Return
                    </TabsTrigger>
                    <TabsTrigger
                      value="summary"
                      disabled={!selectedReturnOffer}
                      className="rounded-none"
                    >
                      Summary
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="outbound" className="mt-0 space-y-3">
                    <div className="border-border overflow-x-auto rounded-none border">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-border bg-muted/50 border-b">
                      <SortableTh
                        sortKey="route"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Route"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="date"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Date"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="departure"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Departure"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="arrival"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Arrival"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="duration"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Duration"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="stops"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Stops"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="cost"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Cost"
                        onSort={handleManualSort}
                      />
                      <SortableTh
                        sortKey="airline"
                        currentSortBy={manualSortBy}
                        currentSortDir={manualSortDir}
                        label="Airline"
                        onSort={handleManualSort}
                      />
                      <th className="w-0 p-2" />
                      <th className="w-0 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {manualFilteredAndSortedOffers.map((offer) => {
                      const row = getOfferRow(offer)
                      const airlineName = offer.owner?.name ?? "Airline"
                      const selectedOutbound = isSerpRoundTripTwoStep && selectedOutboundOfferId === offer.id
                      const selected = !isSerpRoundTripTwoStep && selectedOfferId === offer.id
                      const selectedAny = selected || selectedOutbound
                      const hasStops = getStopsCount(offer) >= 1
                      const isExpanded = expandedManualOfferIds.has(offer.id)
                      const stopDetails = getStopDetails(offer)
                      return (
                        <Fragment key={offer.id}>
                          <tr
                            className={cn(
                              "border-border border-b last:border-b-0",
                              selectedAny && "bg-primary/5"
                            )}
                          >
                            <td className="p-2">{row.route}</td>
                            <td className="p-2 text-muted-foreground">{row.dateStr}</td>
                            <td className="p-2">{row.departure}</td>
                            <td className="p-2">{row.arrival}</td>
                            <td className="p-2">{row.duration}</td>
                            <td className="p-2 text-muted-foreground">
                              {hasStops ? (
                                <button
                                  type="button"
                                  onClick={() => toggleManualExpanded(offer.id)}
                                  className="inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded"
                                >
                                  {getStopsLabel(offer)}
                                  {isExpanded ? (
                                    <ChevronUpIcon className="size-3.5" />
                                  ) : (
                                    <ChevronDownIcon className="size-3.5" />
                                  )}
                                </button>
                              ) : (
                                getStopsLabel(offer)
                              )}
                            </td>
                            <td className="p-2 font-medium">
                              {offer.totalAmount} {offer.totalCurrency}
                            </td>
                            <td className="p-2">{airlineName}</td>
                            <td className="p-2">
                              {isSerpRoundTripTwoStep ? (
                                <Button
                                  variant={selectedOutbound ? "secondary" : "outline"}
                                  size="sm"
                                  className="rounded-none"
                                  disabled={!offer.departureToken}
                                  onClick={() => {
                                    const next = selectedOutboundOfferId === offer.id ? null : offer.id
                                    setSelectedOutboundOfferId(next)
                                    setSelectedOfferId(null)
                                    if (next && offer.departureToken) {
                                      fetchReturnFlights(offer)
                                      setSaveConfirmation("Outbound selected. Now select your inbound flight.")
                                      setFlightStepTab("return")
                                    } else {
                                      setReturnOffers([])
                                      setSelectedReturnOfferId(null)
                                      setFlightStepTab("outbound")
                                    }
                                  }}
                                >
                                  {selectedOutbound ? <CheckIcon className="size-3.5" /> : "Select outbound"}
                                </Button>
                              ) : (
                                <Button
                                  variant={selected ? "secondary" : "outline"}
                                  size="sm"
                                  className="rounded-none"
                                  onClick={() =>
                                    setSelectedOfferId((id) =>
                                      id === offer.id ? null : offer.id
                                    )
                                  }
                                >
                                  {selected ? <CheckIcon className="size-3.5" /> : "Select"}
                                </Button>
                              )}
                            </td>
                            <td className="p-2">
                              {!isSerpRoundTripTwoStep && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="rounded-none"
                                  onClick={() => saveFlightChoice(offer, "manual")}
                                >
                                  Save
                                </Button>
                              )}
                              {isSerpRoundTripTwoStep && (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                          {hasStops && isExpanded && stopDetails.length > 0 && (
                            <tr
                              key={`${offer.id}-stops`}
                              className="border-border border-b bg-muted/20 last:border-b-0"
                            >
                              <td colSpan={10} className="p-2 pl-4 text-muted-foreground">
                                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                  {stopDetails.map((s, i) => (
                                    <li key={i}>
                                      Stop {s.stopIndex}
                                      {offer.slices.length > 1 && ` (leg ${s.sliceIndex + 1})`}:{" "}
                                      <span className="font-medium text-foreground/80">
                                        {s.airportCode || s.airportName}
                                      </span>
                                      {s.airportCode && s.airportName !== s.airportCode && (
                                        <span> — {s.airportName}</span>
                                      )}
                                      {" · "}
                                      <span className="italic">
                                        {formatLayover(s.layoverMinutes)} layover
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
                    {selectedOutboundOffer && (
                      <Button
                        className="rounded-none"
                        onClick={() => {
                          fetchReturnFlights(selectedOutboundOffer)
                          setFlightStepTab("return")
                        }}
                      >
                        Continue to return flights
                        <ArrowDownIcon className="ml-1 size-3.5" />
                      </Button>
                    )}
                  </TabsContent>
                  <TabsContent value="return" className="mt-0 space-y-3">
                    <h3 className="text-sm font-semibold">
                      Return flights ({destination?.iataCode ?? ""} → {origin?.iataCode ?? ""}) — {returnDate}
                    </h3>
                    {returnLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2Icon className="size-4 animate-spin" />
                        Loading return options…
                      </div>
                    )}
                    {returnError && (
                      <p className="text-destructive text-sm">{returnError}</p>
                    )}
                    {!returnLoading && returnOffers.length === 0 && !returnError && selectedOutboundOffer != null && (
                      <p className="text-muted-foreground rounded-none border border-border bg-muted/20 px-3 py-4 text-sm">
                        No return flights found for this date. Try a different return date or search again.
                      </p>
                    )}
                    {!returnLoading && returnOffers.length > 0 && (
                      <>
                        <div className="border-border overflow-x-auto rounded-none border">
                          <table className="w-full min-w-[640px] text-xs">
                            <thead>
                              <tr className="border-border bg-muted/50 border-b">
                                <th className="text-left p-2 font-medium">Route</th>
                                <th className="text-left p-2 font-medium">Date</th>
                                <th className="text-left p-2 font-medium">Departure</th>
                                <th className="text-left p-2 font-medium">Arrival</th>
                                <th className="text-left p-2 font-medium">Duration</th>
                                <th className="text-left p-2 font-medium">Stops</th>
                                <th className="text-left p-2 font-medium">Cost</th>
                                <th className="text-left p-2 font-medium">Airline</th>
                                <th className="w-0 p-2" />
                                <th className="w-0 p-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {returnOffers.map((offer) => {
                                const row = getOfferRow(offer)
                                const airlineName = offer.owner?.name ?? "Airline"
                                const selectedRet = selectedReturnOfferId === offer.id
                                const hasStopsRet = getStopsCount(offer) >= 1
                                const isExpandedRet = expandedReturnOfferIds.has(offer.id)
                                const stopDetailsRet = getStopDetails(offer)
                                return (
                                  <Fragment key={offer.id}>
                                    <tr
                                      className={cn(
                                        "border-border border-b last:border-b-0",
                                        selectedRet && "bg-primary/5"
                                      )}
                                    >
                                      <td className="p-2">{row.route}</td>
                                      <td className="p-2 text-muted-foreground">{row.dateStr}</td>
                                      <td className="p-2">{row.departure}</td>
                                      <td className="p-2">{row.arrival}</td>
                                      <td className="p-2">{row.duration}</td>
                                      <td className="p-2 text-muted-foreground">
                                        {hasStopsRet ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleReturnExpanded(offer.id)}
                                            className="inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded"
                                          >
                                            {getStopsLabel(offer)}
                                            {isExpandedRet ? (
                                              <ChevronUpIcon className="size-3.5" />
                                            ) : (
                                              <ChevronDownIcon className="size-3.5" />
                                            )}
                                          </button>
                                        ) : (
                                          getStopsLabel(offer)
                                        )}
                                      </td>
                                      <td className="p-2 font-medium">
                                        {offer.totalAmount} {offer.totalCurrency}
                                      </td>
                                      <td className="p-2">{airlineName}</td>
                                      <td className="p-2">
                                        <Button
                                          variant={selectedRet ? "secondary" : "outline"}
                                          size="sm"
                                          className="rounded-none"
                                          onClick={() =>
                                            setSelectedReturnOfferId((id) =>
                                              id === offer.id ? null : offer.id
                                            )
                                          }
                                        >
                                          {selectedRet ? <CheckIcon className="size-3.5" /> : "Select"}
                                        </Button>
                                      </td>
                                      <td className="p-2">
                                        <span className="text-muted-foreground text-xs">—</span>
                                      </td>
                                    </tr>
                                    {hasStopsRet && isExpandedRet && stopDetailsRet.length > 0 && (
                                      <tr
                                        key={`${offer.id}-stops`}
                                        className="border-border border-b bg-muted/20 last:border-b-0"
                                      >
                                        <td colSpan={10} className="p-2 pl-4 text-muted-foreground">
                                          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                            {stopDetailsRet.map((s, i) => (
                                              <li key={i}>
                                                Stop {s.stopIndex}:{" "}
                                                <span className="font-medium text-foreground/80">
                                                  {s.airportCode || s.airportName}
                                                </span>
                                                {" · "}
                                                <span className="italic">
                                                  {formatLayover(s.layoverMinutes)} layover
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        {selectedReturnOffer && (
                          <Button
                            className="rounded-none"
                            onClick={() => setFlightStepTab("summary")}
                          >
                            Continue to summary
                            <ArrowDownIcon className="ml-1 size-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="summary" className="mt-0 space-y-3">
                    {selectedOutboundOffer && (
                      <div className="border-border rounded-none border bg-muted/20 p-3">
                        <p className="text-muted-foreground mb-1 text-xs font-medium">Outbound</p>
                        <p className="text-sm">
                          {getOfferRow(selectedOutboundOffer).route} · {getOfferRow(selectedOutboundOffer).dateStr} · {selectedOutboundOffer.owner?.name} — {selectedOutboundOffer.totalAmount} {selectedOutboundOffer.totalCurrency}
                        </p>
                      </div>
                    )}
                    {selectedReturnOffer && (
                      <div className="border-border rounded-none border bg-muted/20 p-3">
                        <p className="text-muted-foreground mb-1 text-xs font-medium">Return</p>
                        <p className="text-sm">
                          {getOfferRow(selectedReturnOffer).route} · {getOfferRow(selectedReturnOffer).dateStr} · {selectedReturnOffer.owner?.name} — {selectedReturnOffer.totalAmount} {selectedReturnOffer.totalCurrency}
                        </p>
                      </div>
                    )}
                    {offerForBook != null && (
                      <div className="bg-muted/50 border-border sticky bottom-2 flex flex-wrap items-center justify-between gap-2 rounded-none border p-3">
                        <span className="text-xs font-medium">
                          Outbound + Return: {offerForBook.owner?.name} — {offerForBook.totalAmount} {offerForBook.totalCurrency}
                        </span>
                        <Button
                          size="sm"
                          className="rounded-none"
                          onClick={saveRoundTripSelection}
                        >
                          Confirm save
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <div className="border-border overflow-x-auto rounded-none border">
                    <table className="w-full min-w-[640px] text-xs">
                      <thead>
                        <tr className="border-border bg-muted/50 border-b">
                          <SortableTh sortKey="route" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Route" onSort={handleManualSort} />
                          <SortableTh sortKey="date" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Date" onSort={handleManualSort} />
                          <SortableTh sortKey="departure" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Departure" onSort={handleManualSort} />
                          <SortableTh sortKey="arrival" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Arrival" onSort={handleManualSort} />
                          <SortableTh sortKey="duration" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Duration" onSort={handleManualSort} />
                          <SortableTh sortKey="stops" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Stops" onSort={handleManualSort} />
                          <SortableTh sortKey="cost" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Cost" onSort={handleManualSort} />
                          <SortableTh sortKey="airline" currentSortBy={manualSortBy} currentSortDir={manualSortDir} label="Airline" onSort={handleManualSort} />
                          <th className="w-0 p-2" />
                          <th className="w-0 p-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {manualFilteredAndSortedOffers.map((offer) => {
                          const row = getOfferRow(offer)
                          const airlineName = offer.owner?.name ?? "Airline"
                          const selected = selectedOfferId === offer.id
                          const hasStops = getStopsCount(offer) >= 1
                          const isExpanded = expandedManualOfferIds.has(offer.id)
                          const stopDetails = getStopDetails(offer)
                          return (
                            <Fragment key={offer.id}>
                              <tr className={cn("border-border border-b last:border-b-0", selected && "bg-primary/5")}>
                                <td className="p-2">{row.route}</td>
                                <td className="p-2 text-muted-foreground">{row.dateStr}</td>
                                <td className="p-2">{row.departure}</td>
                                <td className="p-2">{row.arrival}</td>
                                <td className="p-2">{row.duration}</td>
                                <td className="p-2 text-muted-foreground">
                                  {hasStops ? (
                                    <button type="button" onClick={() => toggleManualExpanded(offer.id)} className="inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded">
                                      {getStopsLabel(offer)}
                                      {isExpanded ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
                                    </button>
                                  ) : (
                                    getStopsLabel(offer)
                                  )}
                                </td>
                                <td className="p-2 font-medium">{offer.totalAmount} {offer.totalCurrency}</td>
                                <td className="p-2">{airlineName}</td>
                                <td className="p-2">
                                  <Button variant={selected ? "secondary" : "outline"} size="sm" className="rounded-none" onClick={() => setSelectedOfferId((id) => (id === offer.id ? null : offer.id))}>
                                    {selected ? <CheckIcon className="size-3.5" /> : "Select"}
                                  </Button>
                                </td>
                                <td className="p-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-none"
                                    onClick={() => saveFlightChoice(offer, "manual")}
                                  >
                                    Save
                                  </Button>
                                </td>
                              </tr>
                              {hasStops && isExpanded && stopDetails.length > 0 && (
                                <tr key={`${offer.id}-stops`} className="border-border border-b bg-muted/20 last:border-b-0">
                                  <td colSpan={10} className="p-2 pl-4 text-muted-foreground">
                                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                      {stopDetails.map((s, i) => (
                                        <li key={i}>
                                          Stop {s.stopIndex}
                                          {offer.slices.length > 1 && ` (leg ${s.sliceIndex + 1})`}:{" "}
                                          <span className="font-medium text-foreground/80">{s.airportCode || s.airportName}</span>
                                          {s.airportCode && s.airportName !== s.airportCode && <span> — {s.airportName}</span>}
                                          {" · "}
                                          <span className="italic">{formatLayover(s.layoverMinutes)} layover</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selectedOfferId && offerForBook != null && (
                    <div className="bg-muted/50 border-border sticky bottom-2 flex flex-wrap items-center justify-between gap-2 rounded-none border p-3">
                      <span className="text-xs font-medium">
                        Selected: {offerForBook.owner?.name} — {offerForBook.totalAmount} {offerForBook.totalCurrency}
                      </span>
                      <Button
                        size="sm"
                        className="rounded-none"
                        onClick={() => saveFlightChoice(offerForBook, "manual-selected")}
                      >
                        Save selection
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {searched && !loading && offers.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No flights found. Try different dates or airports.
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  )
}
