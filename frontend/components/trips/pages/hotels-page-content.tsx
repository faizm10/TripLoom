"use client"

import * as React from "react"
import {
  BedDoubleIcon,
  CheckIcon,
  ChevronRightIcon,
  MapIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
  WifiIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useUpdateTrip } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { Trip } from "@/lib/trips"

// ─── Mock data ───────────────────────────────────────────────────────────────

type Amenity = "WiFi" | "Pool" | "Gym" | "Parking" | "Breakfast" | "Spa" | "Restaurant"

interface HotelResult {
  id: string
  name: string
  area: string
  stars: number
  reviewScore: number
  reviewCount: number
  pricePerNight: number
  currency: string
  roomType: string
  amenities: Amenity[]
  isBestPick?: boolean
  distanceToCenter: string
  image: string // gradient placeholder color
}

const MOCK_HOTELS: HotelResult[] = [
  {
    id: "h1",
    name: "The Grand Metropolitan",
    area: "City Centre",
    stars: 5,
    reviewScore: 9.2,
    reviewCount: 4812,
    pricePerNight: 289,
    currency: "CAD",
    roomType: "Superior King Room",
    amenities: ["WiFi", "Pool", "Gym", "Spa", "Restaurant"],
    isBestPick: true,
    distanceToCenter: "0.3 km",
    image: "from-blue-950 to-slate-900",
  },
  {
    id: "h2",
    name: "Nomad & Co. Boutique Hotel",
    area: "Arts District",
    stars: 4,
    reviewScore: 9.0,
    reviewCount: 2341,
    pricePerNight: 179,
    currency: "CAD",
    roomType: "Deluxe Double Room",
    amenities: ["WiFi", "Breakfast", "Gym"],
    distanceToCenter: "1.2 km",
    image: "from-amber-900 to-stone-900",
  },
  {
    id: "h3",
    name: "Harbour View Suites",
    area: "Waterfront",
    stars: 4,
    reviewScore: 8.7,
    reviewCount: 1893,
    pricePerNight: 219,
    currency: "CAD",
    roomType: "Harbour View Suite",
    amenities: ["WiFi", "Pool", "Parking", "Restaurant"],
    distanceToCenter: "2.0 km",
    image: "from-cyan-950 to-slate-900",
  },
  {
    id: "h4",
    name: "Transit Inn Express",
    area: "Airport / Transit Hub",
    stars: 3,
    reviewScore: 8.1,
    reviewCount: 3210,
    pricePerNight: 99,
    currency: "CAD",
    roomType: "Standard Queen Room",
    amenities: ["WiFi", "Parking", "Breakfast"],
    distanceToCenter: "5.5 km",
    image: "from-emerald-950 to-slate-900",
  },
  {
    id: "h5",
    name: "Casa del Viajero",
    area: "Old Town",
    stars: 4,
    reviewScore: 8.9,
    reviewCount: 987,
    pricePerNight: 155,
    currency: "CAD",
    roomType: "Classic Room with Balcony",
    amenities: ["WiFi", "Restaurant", "Spa"],
    distanceToCenter: "0.8 km",
    image: "from-rose-950 to-slate-900",
  },
  {
    id: "h6",
    name: "Nordic Loft Hotel",
    area: "Design Quarter",
    stars: 4,
    reviewScore: 8.5,
    reviewCount: 1452,
    pricePerNight: 139,
    currency: "CAD",
    roomType: "Scandinavian Double",
    amenities: ["WiFi", "Gym", "Breakfast"],
    distanceToCenter: "1.8 km",
    image: "from-violet-950 to-slate-900",
  },
]

const ALL_AMENITIES: Amenity[] = ["WiFi", "Pool", "Gym", "Parking", "Breakfast", "Spa", "Restaurant"]

const AMENITY_ICONS: Partial<Record<Amenity, React.ElementType>> = {
  WiFi: WifiIcon,
  Pool: () => <span className="text-[10px]">🏊</span>,
  Gym: () => <span className="text-[10px]">🏋️</span>,
  Parking: () => <span className="text-[10px]">🅿️</span>,
  Breakfast: () => <span className="text-[10px]">🥐</span>,
  Spa: () => <span className="text-[10px]">💆</span>,
  Restaurant: () => <span className="text-[10px]">🍽️</span>,
}

// ─── Stars renderer ───────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`size-3 ${i < count ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
        />
      ))}
    </span>
  )
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

function HotelCard({
  hotel,
  isSelected,
  onSelect,
}: {
  hotel: HotelResult
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        isSelected
          ? "border-primary shadow-md shadow-primary/10"
          : "border-border hover:border-primary/40"
      }`}
    >
      {/* Best pick badge */}
      {hotel.isBestPick && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
          <SparklesIcon className="size-3" />
          Best for First-Timers
        </div>
      )}

      {/* Image placeholder */}
      <div className={`h-36 bg-gradient-to-br ${hotel.image} relative flex items-end p-3`}>
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="size-3 text-white/70" />
          <span className="text-[11px] text-white/80">{hotel.area}</span>
          <span className="text-[11px] text-white/50">· {hotel.distanceToCenter} to centre</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug">{hotel.name}</h3>
            <div className="shrink-0 text-right">
              <p className="text-base font-bold text-foreground">
                ${hotel.pricePerNight}
              </p>
              <p className="text-[10px] text-muted-foreground">/ night</p>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <StarRating count={hotel.stars} />
            <span className="text-[11px] text-muted-foreground">
              {hotel.reviewScore} · {hotel.reviewCount.toLocaleString()} reviews
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{hotel.roomType}</p>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1">
          {hotel.amenities.map((a) => {
            const Icon = AMENITY_ICONS[a]
            return (
              <span
                key={a}
                className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {Icon ? <Icon /> : null}
                {a}
              </span>
            )
          })}
        </div>

        {/* Action */}
        <div className="mt-auto">
          {isSelected ? (
            <div className="flex items-center gap-2 border border-primary bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
              <CheckIcon className="size-3.5" />
              Selected
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full" onClick={onSelect}>
              Select Hotel
              <ChevronRightIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HotelsPageContent({ trip: tripProp }: { trip: Trip }) {
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp
  const updateTrip = useUpdateTrip()

  // Search form state
  const [destination, setDestination] = React.useState(trip.destination)
  const [checkIn, setCheckIn] = React.useState(trip.startDate)
  const [checkOut, setCheckOut] = React.useState(trip.endDate)
  const [guests, setGuests] = React.useState(String(trip.travelers))
  const [hasSearched, setHasSearched] = React.useState(false)

  // Filter state
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 400])
  const [minStars, setMinStars] = React.useState(0)
  const [selectedAmenities, setSelectedAmenities] = React.useState<Set<Amenity>>(new Set())

  // UI state
  const [selectedHotelId, setSelectedHotelId] = React.useState<string | null>(
    trip.selectedHotel ? "h1" : null
  )
  const [mapOpen, setMapOpen] = React.useState(false)

  const selectedHotel = MOCK_HOTELS.find((h) => h.id === selectedHotelId) ?? null

  // Filter logic
  const filteredHotels = React.useMemo(() => {
    return MOCK_HOTELS.filter((h) => {
      if (h.pricePerNight < priceRange[0] || h.pricePerNight > priceRange[1]) return false
      if (h.stars < minStars) return false
      if (selectedAmenities.size > 0) {
        for (const a of selectedAmenities) {
          if (!h.amenities.includes(a)) return false
        }
      }
      return true
    })
  }, [priceRange, minStars, selectedAmenities])

  function handleSearch() {
    setHasSearched(true)
    toast.success(`Searching hotels in ${destination}…`)
  }

  function handleSelectHotel(hotel: HotelResult) {
    setSelectedHotelId(hotel.id)
    updateTrip(trip.id, {
      selectedHotel: true,
      hotelSummary: `${hotel.name} · $${hotel.pricePerNight}/night`,
      hotelArea: hotel.area,
    })
    toast.success(`${hotel.name} selected!`)
  }

  function handleClearHotel() {
    setSelectedHotelId(null)
    updateTrip(trip.id, { selectedHotel: false, hotelSummary: undefined, hotelArea: undefined })
    toast.message("Hotel selection cleared.")
  }

  function toggleAmenity(a: Amenity) {
    setSelectedAmenities((prev) => {
      const next = new Set(prev)
      if (next.has(a)) next.delete(a)
      else next.add(a)
      return next
    })
  }

  return (
    <div className="space-y-5">
      {/* ── Selected Hotel Banner ── */}
      {selectedHotel && (
        <div className="flex items-center justify-between gap-4 border border-primary bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
              <BedDoubleIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{selectedHotel.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedHotel.area} · ${selectedHotel.pricePerNight}/night · {selectedHotel.roomType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              Confirmed
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleClearHotel}>
              <XIcon className="size-3.5" />
              Change
            </Button>
          </div>
        </div>
      )}

      {/* ── Search Bar ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hotel Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 lg:col-span-1">
              <Label className="text-xs">Destination</Label>
              <div className="relative">
                <MapPinIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-8 text-sm"
                  placeholder="City or area"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Check-in</Label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Check-out</Label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Guests</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <UsersIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="pl-8 text-sm"
                  />
                </div>
                <Button onClick={handleSearch} className="shrink-0">
                  <SearchIcon className="size-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {!hasSearched && (
            <p className="mt-3 text-xs text-muted-foreground">
              ← Pre-filled from your trip dates. Adjust and search to find available hotels.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Results + Filters ── */}
      <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
        {/* Filters sidebar */}
        <aside className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Price range */}
              <div className="space-y-3">
                <p className="text-xs font-medium">Price per night</p>
                <Slider
                  min={0}
                  max={400}
                  step={10}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              {/* Star rating */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Minimum stars</p>
                <div className="flex gap-1">
                  {[0, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMinStars(s)}
                      className={`flex h-7 items-center px-2 text-xs border transition-colors ${
                        minStars === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {s === 0 ? "Any" : `${s}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <p className="text-xs font-medium">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_AMENITIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors ${
                        selectedAmenities.has(a)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              {(minStars > 0 || selectedAmenities.size > 0 || priceRange[0] > 0 || priceRange[1] < 400) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    setPriceRange([0, 400])
                    setMinStars(0)
                    setSelectedAmenities(new Set())
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Map toggle */}
          <Button
            variant={mapOpen ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => setMapOpen((v) => !v)}
          >
            <MapIcon className="size-4" />
            {mapOpen ? "Hide Map" : "Show Map"}
          </Button>
        </aside>

        {/* Hotels grid + map */}
        <div className="space-y-4">
          {/* Map panel */}
          {mapOpen && (
            <div className="flex h-48 items-center justify-center border border-dashed border-border bg-muted/20 text-center">
              <div className="space-y-1">
                <MapIcon className="mx-auto size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">Map view coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Google Maps JS SDK will show hotels and distances.
                </p>
              </div>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredHotels.length} hotel{filteredHotels.length !== 1 ? "s" : ""} available
            </p>
            {filteredHotels.length < MOCK_HOTELS.length && (
              <p className="text-xs text-muted-foreground">
                {MOCK_HOTELS.length - filteredHotels.length} hidden by filters
              </p>
            )}
          </div>

          {/* Hotel cards */}
          {filteredHotels.length === 0 ? (
            <div className="flex h-40 items-center justify-center border border-dashed border-border">
              <div className="text-center">
                <p className="text-sm font-medium">No hotels match your filters.</p>
                <p className="text-xs text-muted-foreground">Try adjusting the price range or amenities.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  isSelected={selectedHotelId === hotel.id}
                  onSelect={() => handleSelectHotel(hotel)}
                />
              ))}
            </div>
          )}

          {/* First-timer tip */}
          <div className="flex gap-3 border border-border bg-muted/20 p-4">
            <SparklesIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold">First-timer tip</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Stay in or near the city centre for your first trip — you'll spend less time on
                transit and more time exploring. Neighbourhood hotels ($140–$200/night) tend to
                hit the sweet spot of value and location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
