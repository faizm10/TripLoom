"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function InviteAcceptClient({
  token,
  isLoggedIn,
}: {
  token: string
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loginHref = `/auth/login?redirect=${encodeURIComponent(`/invite/${encodeURIComponent(token)}`)}`
  const signupHref = `/auth/signup?redirect=${encodeURIComponent(`/invite/${encodeURIComponent(token)}`)}`

  async function accept() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}/accept`, {
        method: "POST",
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string; tripId?: string }
      if (!res.ok) {
        setError(body.error ?? "Could not accept invite.")
        setLoading(false)
        return
      }
      if (body.tripId) {
        router.push(`/trips/${body.tripId}/overview`)
        router.refresh()
        return
      }
      setError("Unexpected response.")
    } catch {
      setError("Network error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-border">
      <CardHeader>
        <CardTitle className="text-lg">Trip invitation</CardTitle>
        <CardDescription>
          {isLoggedIn
            ? "Accept to join this trip as a collaborator and open it in your workspace."
            : "Sign in or create an account to accept this invitation and join the trip."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {isLoggedIn ? (
          <Button type="button" className="w-full" disabled={loading} onClick={() => void accept()}>
            {loading ? "Joining…" : "Join trip"}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={loginHref}>Sign in to accept</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={signupHref}>Create account</Link>
            </Button>
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to TripLoom
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
