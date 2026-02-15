import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function TripNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Trip not found</h1>
      <p className="text-sm text-muted-foreground">
        The requested trip does not exist or is no longer available.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  )
}
