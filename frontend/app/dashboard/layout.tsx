import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "TripLoom dashboard for onboarding, bookings, transit, and AI trip planning.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
