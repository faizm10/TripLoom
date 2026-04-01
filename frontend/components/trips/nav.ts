import type { LucideIcon } from "lucide-react"
import {
  CircleDollarSignIcon,
  FileTextIcon,
  HotelIcon,
  LayoutDashboardIcon,
  MapIcon,
  PlaneIcon,
  RouteIcon,
  TrainFrontIcon,
  UsersIcon,
} from "lucide-react"

import type { Trip } from "@/lib/trips"
import { getTripTravelScope } from "@/lib/trips"

export type TripNavItem = {
  key: string
  label: string
  hrefSuffix: string
  icon: LucideIcon
}

const baseTripNavItems: TripNavItem[] = [
  { key: "overview", label: "Overview", hrefSuffix: "", icon: LayoutDashboardIcon },
  { key: "itinerary", label: "Itinerary", hrefSuffix: "/itinerary", icon: MapIcon },
  { key: "flights", label: "Flights", hrefSuffix: "/flights", icon: PlaneIcon },
  {
    key: "buses-trains",
    label: "Buses & trains",
    hrefSuffix: "/buses-trains",
    icon: TrainFrontIcon,
  },
  { key: "hotels", label: "Hotels", hrefSuffix: "/hotels", icon: HotelIcon },
  { key: "transit", label: "Transit", hrefSuffix: "/transit", icon: RouteIcon },
  { key: "finance", label: "Finance", hrefSuffix: "/finance", icon: CircleDollarSignIcon },
  { key: "group", label: "Group", hrefSuffix: "/group", icon: UsersIcon },
  { key: "docs", label: "Documents", hrefSuffix: "/docs", icon: FileTextIcon },
]

/** Full nav list for international trips (default): no Buses & trains. */
export const tripNavItemsInternational: TripNavItem[] = baseTripNavItems.filter(
  (item) => item.key !== "buses-trains"
)

/** Domestic trips: Flights and Buses & trains both shown. */
export const tripNavItemsDomestic: TripNavItem[] = [...baseTripNavItems]

export function getTripNavItemsForTrip(trip: Trip): TripNavItem[] {
  return getTripTravelScope(trip) === "domestic" ? tripNavItemsDomestic : tripNavItemsInternational
}

/** @deprecated Use getTripNavItemsForTrip(trip) or tripNavItemsInternational */
export const tripNavItems = tripNavItemsInternational
