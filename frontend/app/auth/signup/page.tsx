"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, UserPlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { safeAuthRedirectPath } from "@/lib/auth-redirect"
import { getPublicSiteOrigin } from "@/lib/public-site-url"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const afterSignup = safeAuthRedirectPath(searchParams.get("redirect"))
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [oauthLoading, setOauthLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const next = encodeURIComponent(afterSignup)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getPublicSiteOrigin()}/auth/callback?next=${next}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      // Email confirmation disabled — Supabase returned a live session
      router.push(afterSignup)
      router.refresh()
      return
    }

    // Email confirmation still enabled — show "check your email"
    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setOauthLoading(true)
    setError(null)
    const supabase = createClient()
    const next = encodeURIComponent(afterSignup)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getPublicSiteOrigin()}/auth/callback?next=${next}`,
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/3 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, oklch(0.71 0.13 215), oklch(0.61 0.11 222) 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground text-sm font-bold">
              TL
            </span>
            <span className="text-lg font-semibold tracking-tight">TripLoom</span>
          </Link>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <div className="border border-border bg-card p-8 shadow-sm">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-primary/10 text-primary">
                <CheckCircle2Icon className="size-6" />
              </div>
              <div>
                <p className="font-semibold">Check your email</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a confirmation link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  Click it to activate your account.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="text-xs text-primary hover:underline"
              >
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading || loading}
              className="w-full flex items-center justify-center gap-3 h-8 border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              {oauthLoading ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="size-4 shrink-0" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-xs text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs font-medium">Confirm Password</Label>
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlusIcon className="size-4" />
                    Create Account
                  </span>
                )}
              </Button>
            </form>
            </>
          )}

          {!success && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">← Back to TripLoom</Link>
        </p>
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading…</span>
        </div>
      }
    >
      <SignupForm />
    </React.Suspense>
  )
}
