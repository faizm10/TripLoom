import type * as React from "react"

export type SectionId =
  | "onboarding"
  | "flights"
  | "hotels"
  | "transit"
  | "explore"
  | "settings"

export type NavItem = {
  id: SectionId
  label: string
  icon: React.ComponentType<React.ComponentProps<"svg">>
  badge?: string
}

export type SectionCopy = Record<SectionId, { title: string; subtitle: string }>
