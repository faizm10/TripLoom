import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "TripLoom dashboard for onboarding, bookings, transit, and AI trip planning.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <>{children}</>
}
