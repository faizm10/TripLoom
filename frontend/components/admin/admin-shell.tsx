"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ActivityIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  MapIcon,
  ScrollTextIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: BarChart3Icon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/trips", label: "Trips", icon: MapIcon },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollTextIcon },
]

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ShieldIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold">Admin</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <p className="truncate text-[10px] text-muted-foreground">{userEmail}</p>
          <Link
            href="/dashboard"
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5 md:hidden">
          <ShieldIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold">Admin</span>
          <div className="ml-auto flex items-center gap-3">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs ${active ? "font-medium text-primary" : "text-muted-foreground"}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </header>

        <main className="flex-1 px-6 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
