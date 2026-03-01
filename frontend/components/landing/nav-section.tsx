"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { LogOutIcon, PlaneTakeoffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function NavSection() {
  const { scrollY } = useScroll()
  const backdropOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      style={{}}
    >
      <motion.div
        className="absolute inset-0 bg-background/80 backdrop-blur-md border-b border-border"
        style={{ opacity: backdropOpacity }}
      />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="inline-flex h-7 w-7 items-center justify-center bg-primary text-primary-foreground text-xs font-bold transition-transform group-hover:scale-110">
            TL
          </span>
          <span className="text-sm font-semibold tracking-tight">TripLoom</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#why" className="hover:text-foreground transition-colors">Why Us</a>
          <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
        </nav>

        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">
                    <PlaneTakeoffIcon className="size-3.5" />
                    Dashboard
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSignOut}>
                  <LogOutIcon className="size-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/signup">
                    <PlaneTakeoffIcon className="size-3.5" />
                    Get Started
                  </Link>
                </Button>
              </>
            )
          )}
        </div>
      </div>
    </motion.header>
  )
}

