import { DashboardSearchTrigger } from "@/components/dashboard/dashboard-search-trigger"
import { DashboardHomeContent } from "@/components/dashboard-home/dashboard-home-content"

export default function DashboardHomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 sm:py-10">
      <div className="mb-4 flex justify-end">
        <DashboardSearchTrigger />
      </div>
      <DashboardHomeContent />
    </main>
  )
}
