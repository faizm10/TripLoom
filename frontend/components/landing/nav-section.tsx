"use client"

import * as React from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { PlaneTakeoffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NavSection() {
  const { scrollY } = useScroll()
  const backdropOpacity = useTransform(scrollY, [0, 80], [0, 1])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/0"
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

        <Button asChild size="sm">
          <Link href="/dashboard">
            <PlaneTakeoffIcon className="size-3.5" />
            Start Planning
          </Link>
        </Button>
      </div>
    </motion.header>
  )
}
