import {
  CircleDollarSignIcon,
  FileTextIcon,
  HotelIcon,
  LayoutDashboardIcon,
  MapIcon,
  PlaneIcon,
  RouteIcon,
  UsersIcon,
} from "lucide-react"

export const tripNavItems = [
  { key: "overview", label: "Overview", hrefSuffix: "", icon: LayoutDashboardIcon },
  { key: "itinerary", label: "Itinerary", hrefSuffix: "/itinerary", icon: MapIcon },
  { key: "flights", label: "Flights", hrefSuffix: "/flights", icon: PlaneIcon },
  { key: "hotels", label: "Hotels", hrefSuffix: "/hotels", icon: HotelIcon },
  { key: "transit", label: "Transit", hrefSuffix: "/transit", icon: RouteIcon },
  { key: "finance", label: "Finance", hrefSuffix: "/finance", icon: CircleDollarSignIcon },
  { key: "group", label: "Group", hrefSuffix: "/group", icon: UsersIcon },
  { key: "docs", label: "Documents", hrefSuffix: "/docs", icon: FileTextIcon },
] as const
