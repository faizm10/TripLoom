"use client"

import { useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
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
import { getAirlineBookingUrl } from "@/lib/airline-booking-urls"
import type { Trip } from "@/lib/trips"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { FlightOffer } from "@/lib/flights"
import { cn } from "@/lib/utils"

type Place = { displayName: string; iataCode: string }
type TripType = "one_way" | "round_trip" | "multi_city"
type Leg = { origin: Place | null; destination: Place | null; date: string }

function formatTime(iso: string): string {
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

const minDate = new Date().toISOString().slice(0, 10)

function getOfferRow(offer: FlightOffer) {
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

function durationToMinutes(d: string): number {
  const h = d.match(/(\d+)h/)?.[1]
  const m = d.match(/(\d+)m/)?.[1]
  return (parseInt(h ?? "0", 10) * 60) + parseInt(m ?? "0", 10)
}

type ManualSortKey = "route" | "date" | "departure" | "arrival" | "duration" | "cost" | "airline"
type ExploreSortKey = "destination" | "date" | "cost" | "airline"

export function FlightsPageContent({ trip: tripProp }: { trip: Trip }) {
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp

  const [activeTab, setActiveTab] = useState<"manual" | "explore">("manual")
  const [tripType, setTripType] = useState<TripType>("one_way")

  // Manual: one-way
  const [origin, setOrigin] = useState<Place | null>(null)
  const [destination, setDestination] = useState<Place | null>(null)
  const [departureDate, setDepartureDate] = useState("")
  // Manual: round trip
  const [returnDate, setReturnDate] = useState("")
  // Manual: multi city
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

  // Explore
  const [expOrigin, setExpOrigin] = useState<Place | null>(null)
  const [expDestination, setExpDestination] = useState<Place | null>(null)
  const [expNumDays, setExpNumDays] = useState(7)
  const [expLoading, setExpLoading] = useState(false)
  const [expError, setExpError] = useState<string | null>(null)
  const [expResults, setExpResults] = useState<{
    rows: { date: string; destination: string; destinationName: string; offer: FlightOffer }[]
    overallCheapest: FlightOffer | null
  } | null>(null)
  const [expSelectedOfferId, setExpSelectedOfferId] = useState<string | null>(null)
  const [expSortBy, setExpSortBy] = useState<ExploreSortKey | null>("cost")
  const [expSortDir, setExpSortDir] = useState<"asc" | "desc">("asc")
  const [expFilterAirline, setExpFilterAirline] = useState("")
  const [expFilterMaxPrice, setExpFilterMaxPrice] = useState("")

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

  const handleManualSearch = async () => {
    const slices = buildSlices()
    if (slices.length === 0) {
      setError("Please fill all origin, destination, and date fields.")
      return
    }
    setError(null)
    setLoading(true)
    setOffers([])
    setSearched(false)
    setSelectedOfferId(null)
    try {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slices,
          adults,
          cabin_class: "economy",
        }),
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

  const handleExploreSearch = async () => {
    if (!expOrigin?.iataCode) {
      setExpError("Choose origin.")
      return
    }
    setExpError(null)
    setExpLoading(true)
    setExpResults(null)
    setExpSelectedOfferId(null)
    try {
      const res = await fetch("/api/flights/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: expOrigin.iataCode,
          ...(expDestination?.iataCode && { destination: expDestination.iataCode }),
          num_days: expNumDays,
          adults: 1,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExpError(data?.error ?? "Explore failed")
        return
      }
      setExpResults({
        rows: data.rows ?? [],
        overallCheapest: data.overallCheapest ?? null,
      })
    } catch (e) {
      setExpError(e instanceof Error ? e.message : "Explore failed")
    } finally {
      setExpLoading(false)
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "manual" | "explore")}>
        <TabsList variant="default" className="w-full max-w-md">
          <TabsTrigger value="manual" className="flex-1">
            <SearchIcon className="size-3.5" />
            Manual search
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex-1">
            <CalendarIcon className="size-3.5" />
            Explore (cheapest dates)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlaneIcon className="size-4" />
                Manual flight search
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                One way, round trip, or multi city for {trip.destination}. Select an offer then book on the airline.
              </p>
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
                      placeholder="City or airport"
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
                      placeholder="City or airport"
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
                      placeholder="City or airport"
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
                      placeholder="City or airport"
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
                            placeholder="Origin"
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
                            placeholder="Destination"
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
                Results
                {tripType === "one_way" &&
                  `: ${origin?.displayName ?? origin?.iataCode} → ${destination?.displayName ?? destination?.iataCode}`}
                {tripType === "round_trip" &&
                  `: ${origin?.displayName ?? origin?.iataCode} ↔ ${destination?.displayName ?? destination?.iataCode}`}
              </h2>
              <div className="border-border overflow-x-auto rounded-none border">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-border bg-muted/50 border-b">
                      <th className="text-left p-2 font-medium">Route</th>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Departure</th>
                      <th className="text-left p-2 font-medium">Arrival</th>
                      <th className="text-left p-2 font-medium">Duration</th>
                      <th className="text-left p-2 font-medium">Cost</th>
                      <th className="text-left p-2 font-medium">Airline</th>
                      <th className="w-0 p-2" />
                      <th className="w-0 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer) => {
                      const row = getOfferRow(offer)
                      const airlineName = offer.owner?.name ?? "Airline"
                      const bookUrl = getAirlineBookingUrl(offer.owner?.iataCode ?? "")
                      const selected = selectedOfferId === offer.id
                      return (
                        <tr
                          key={offer.id}
                          className={cn(
                            "border-border border-b last:border-b-0",
                            selected && "bg-primary/5"
                          )}
                        >
                          <td className="p-2">{row.route}</td>
                          <td className="p-2 text-muted-foreground">{row.dateStr}</td>
                          <td className="p-2">{row.departure}</td>
                          <td className="p-2">{row.arrival}</td>
                          <td className="p-2">{row.duration}</td>
                          <td className="p-2 font-medium">
                            {offer.totalAmount} {offer.totalCurrency}
                          </td>
                          <td className="p-2">{airlineName}</td>
                          <td className="p-2">
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
                          </td>
                          <td className="p-2">
                            <Button asChild variant="default" size="sm" className="rounded-none">
                              <a
                                href={bookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                Book
                                <ExternalLinkIcon className="size-3.5" />
                              </a>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {selectedOfferId && (
                <div className="bg-muted/50 border-border sticky bottom-2 flex flex-wrap items-center justify-between gap-2 rounded-none border p-3">
                  <span className="text-xs font-medium">
                    Selected:{" "}
                    {offers.find((o) => o.id === selectedOfferId)?.owner?.name} —{" "}
                    {offers.find((o) => o.id === selectedOfferId)?.totalAmount}{" "}
                    {offers.find((o) => o.id === selectedOfferId)?.totalCurrency}
                  </span>
                  <Button asChild size="sm" className="rounded-none">
                    <a
                      href={getAirlineBookingUrl(
                        offers.find((o) => o.id === selectedOfferId)?.owner
                          ?.iataCode ?? ""
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Book on airline
                      <ExternalLinkIcon className="ml-1 size-3.5" />
                    </a>
                  </Button>
                </div>
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
        </TabsContent>

        <TabsContent value="explore" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-4" />
                Explore cheapest dates
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                See the cheapest flights for the next X days. Leave &quot;To&quot; empty to explore multiple destinations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <DestinationSearch
                    placeholder="City or airport"
                    value={expOrigin?.displayName}
                    onChange={(v) =>
                      setExpOrigin((prev) =>
                        prev ? { ...prev, displayName: v } : null
                      )
                    }
                    onSelect={((s: DestinationSuggestion) =>
                      setPlace(setExpOrigin)(s)) as (suggestion: DestinationSuggestion) => void}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To (optional)</Label>
                  <DestinationSearch
                    placeholder="Leave empty for multiple destinations"
                    value={expDestination?.displayName}
                    onChange={(v) =>
                      setExpDestination((prev) =>
                        prev ? { ...prev, displayName: v } : null
                      )
                    }
                    onSelect={((s: DestinationSuggestion) =>
                      setPlace(setExpDestination)(s)) as (suggestion: DestinationSuggestion) => void}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of days to check</Label>
                  <select
                    value={expNumDays}
                    onChange={(e) => setExpNumDays(Number(e.target.value))}
                    className="border-input bg-background h-9 w-full rounded-none border px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                  >
                    {[3, 5, 7, 10, 14].map((n) => (
                      <option key={n} value={n}>
                        {n} days
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {expError && (
                <p className="text-destructive text-xs" role="alert">
                  {expError}
                </p>
              )}
              <Button onClick={handleExploreSearch} disabled={expLoading}>
                {expLoading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Checking dates…
                  </>
                ) : (
                  <>
                    <CalendarIcon className="size-4" />
                    Find cheapest dates
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {expResults && expResults.rows.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">
                Cheapest flights
                {expDestination?.displayName
                  ? ` to ${expDestination.displayName}`
                  : " (from your origin)"}
              </h2>
              <div className="border-border overflow-x-auto rounded-none border">
                <table className="w-full min-w-[520px] text-xs">
                  <thead>
                    <tr className="border-border bg-muted/50 border-b">
                      <th className="text-left p-2 font-medium">Destination</th>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="text-left p-2 font-medium">Cost</th>
                      <th className="text-left p-2 font-medium">Airline</th>
                      <th className="w-0 p-2" />
                      <th className="w-0 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {expResults.rows.map((row) => {
                      const { date, destinationName, offer } = row
                      const airlineName = offer.owner?.name ?? "Airline"
                      const bookUrl = getAirlineBookingUrl(offer.owner?.iataCode ?? "")
                      const selected = expSelectedOfferId === offer.id
                      return (
                        <tr
                          key={`${row.destination}-${date}-${offer.id}`}
                          className={cn(
                            "border-border border-b last:border-b-0",
                            selected && "bg-primary/5"
                          )}
                        >
                          <td className="p-2">{destinationName}</td>
                          <td className="p-2 text-muted-foreground">
                            {formatDate(date)}
                          </td>
                          <td className="p-2 font-medium">
                            {offer.totalAmount} {offer.totalCurrency}
                          </td>
                          <td className="p-2">{airlineName}</td>
                          <td className="p-2">
                            <Button
                              variant={selected ? "secondary" : "outline"}
                              size="sm"
                              className="rounded-none"
                              onClick={() =>
                                setExpSelectedOfferId((id) =>
                                  id === offer.id ? null : offer.id
                                )
                              }
                            >
                              {selected ? <CheckIcon className="size-3.5" /> : "Select"}
                            </Button>
                          </td>
                          <td className="p-2">
                            <Button asChild variant="default" size="sm" className="rounded-none">
                              <a
                                href={bookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                Book
                                <ExternalLinkIcon className="size-3.5" />
                              </a>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {expResults && expResults.rows.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No flights found for the selected dates.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
