"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  UsersIcon,
  ShieldCheckIcon,
  LinkIcon,
  CopyIcon,
  MailIcon,
  MoreHorizontalIcon,
  CreditCardIcon,
  BriefcaseBusinessIcon,
  EyeIcon,
  UserPlusIcon,
  BanIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useTripPage } from "@/components/trips/trip-shell"
import { getTripMembers, type TripMember } from "@/lib/supabase-trip-members"
import { createClient } from "@/lib/supabase/client"
import {
  createTripCollaboratorInviteAction,
  createTripViewShareLinkAction,
  getTripMemberRoleAction,
  listTripCollaboratorInvitesAction,
  listTripShareLinksAction,
  revokeTripCollaboratorInviteAction,
  revokeTripShareLinkAction,
  type TripCollaboratorInviteSummary,
  type TripShareLinkSummary,
} from "@/lib/actions/trip-share-actions"
import { toPublicAbsoluteUrl } from "@/lib/public-site-url"

function shortUserId(userId: string): string {
  return userId.length > 10 ? `${userId.slice(0, 6)}…${userId.slice(-4)}` : userId
}

function roleLabel(role: string): string {
  if (role === "owner") return "Owner"
  if (role === "editor") return "Editor"
  return "Viewer"
}

function isLinkActive(row: { revoked_at: string | null; expires_at: string | null }): boolean {
  if (row.revoked_at) return false
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return false
  return true
}

export function GroupPageContent() {
  const trip = useTripPage()
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [userId, setUserId] = React.useState<string | null>(null)
  const [myRole, setMyRole] = React.useState<"owner" | "editor" | "viewer" | null>(null)
  const [members, setMembers] = React.useState<TripMember[]>([])
  const [viewLinks, setViewLinks] = React.useState<TripShareLinkSummary[]>([])
  const [invites, setInvites] = React.useState<TripCollaboratorInviteSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [creatingView, setCreatingView] = React.useState(false)
  const [creatingCollab, setCreatingCollab] = React.useState(false)
  const [lastViewUrl, setLastViewUrl] = React.useState<string | null>(null)
  const [lastCollabUrl, setLastCollabUrl] = React.useState<string | null>(null)

  const tripId = trip?.id

  React.useEffect(() => {
    if (!tripId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (cancelled) return
        setUserId(user?.id ?? null)

        const role = await getTripMemberRoleAction(tripId)
        if (cancelled) return
        setMyRole(role)

        const memberRows = await getTripMembers(tripId)
        if (cancelled) return
        setMembers(memberRows)

        if (role === "owner") {
          const [v, inv] = await Promise.all([
            listTripShareLinksAction(tripId),
            listTripCollaboratorInvitesAction(tripId),
          ])
          if (cancelled) return
          setViewLinks(v)
          setInvites(inv)
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Could not load group data.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tripId])

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error("Could not copy")
    }
  }

  async function handleCreateViewLink() {
    if (!tripId) return
    setCreatingView(true)
    try {
      const { sharePath } = await createTripViewShareLinkAction(tripId, { expiresInDays: null })
      const url = toPublicAbsoluteUrl(sharePath)
      setLastViewUrl(url)
      setViewLinks(await listTripShareLinksAction(tripId))
      await copyText("View link", url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create link")
    } finally {
      setCreatingView(false)
    }
  }

  async function handleCreateCollabInvite() {
    if (!tripId) return
    setCreatingCollab(true)
    try {
      const { invitePath } = await createTripCollaboratorInviteAction(tripId, {
        role: "editor",
        expiresInDays: 14,
      })
      const url = toPublicAbsoluteUrl(invitePath)
      setLastCollabUrl(url)
      setInvites(await listTripCollaboratorInvitesAction(tripId))
      await copyText("Invite link", url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invite")
    } finally {
      setCreatingCollab(false)
    }
  }

  async function handleRevokeView(id: string) {
    if (!tripId) return
    try {
      await revokeTripShareLinkAction(id, tripId)
      setViewLinks(await listTripShareLinksAction(tripId))
      toast.success("View link revoked")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke")
    }
  }

  async function handleRevokeInvite(id: string) {
    if (!tripId) return
    try {
      await revokeTripCollaboratorInviteAction(id, tripId)
      setInvites(await listTripCollaboratorInvitesAction(tripId))
      toast.success("Invite revoked")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke")
    }
  }

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    toast.message("Email invites are not wired yet — use a collaborator link instead.")
    setInviteEmail("")
  }

  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }

  const isOwner = myRole === "owner"

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Group & Collaborators</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite collaborators with a secure link, or share a read-only link so others can view the trip
          without signing in.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UsersIcon className="size-4" />
                Trip members ({loading ? "…" : members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading members…</p>
              ) : members.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No members loaded.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((member) => {
                    const isYou = member.user_id === userId
                    const r = member.role
                    return (
                      <li
                        key={`${member.trip_id}-${member.user_id}`}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-full border">
                            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                              {shortUserId(member.user_id)
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium font-mono">{shortUserId(member.user_id)}</p>
                              {isYou ? (
                                <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                                  You
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">Account ID</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            {r === "owner" ? (
                              <ShieldCheckIcon className="size-3.5 text-primary" />
                            ) : null}
                            <span className={r === "owner" ? "font-medium text-primary" : "text-muted-foreground"}>
                              {roleLabel(r)}
                            </span>
                          </div>
                          {!isYou && isOwner ? (
                            <Button variant="ghost" size="icon" className="ml-2 h-8 w-8 text-muted-foreground" disabled>
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Invite Travelers</CardTitle>
              <CardDescription className="text-xs">
                Collaborator links add signed-in users as editors. View links are read-only and work without an
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSendInvite} className="flex gap-2">
                <div className="relative flex-1">
                  <MailIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address (coming soon)"
                    className="pl-9 text-sm"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary" disabled>
                  Invite
                </Button>
              </form>

              {isOwner ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Share links (owner only)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={creatingView}
                        onClick={() => void handleCreateViewLink()}
                        className="touch-manipulation"
                      >
                        <EyeIcon className="mr-1.5 size-3.5" />
                        {creatingView ? "Creating…" : "New view-only link"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={creatingCollab}
                        onClick={() => void handleCreateCollabInvite()}
                        className="touch-manipulation"
                      >
                        <UserPlusIcon className="mr-1.5 size-3.5" />
                        {creatingCollab ? "Creating…" : "New collaborator invite"}
                      </Button>
                    </div>

                    {lastViewUrl ? (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 pl-3">
                        <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{lastViewUrl}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 shrink-0 px-2"
                          onClick={() => void copyText("View link", lastViewUrl)}
                        >
                          <CopyIcon className="mr-1 size-3.5" />
                          Copy
                        </Button>
                      </div>
                    ) : null}

                    {lastCollabUrl ? (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 pl-3">
                        <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                          {lastCollabUrl}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 shrink-0 px-2"
                          onClick={() => void copyText("Invite link", lastCollabUrl)}
                        >
                          <CopyIcon className="mr-1 size-3.5" />
                          Copy
                        </Button>
                      </div>
                    ) : null}

                    {viewLinks.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Active view links</p>
                        <ul className="space-y-2 text-xs">
                          {viewLinks.map((l) => (
                            <li
                              key={l.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 px-3 py-2"
                            >
                              <span className={isLinkActive(l) ? "text-foreground" : "text-muted-foreground line-through"}>
                                {l.label || "View link"} ·{" "}
                                {l.expires_at ? `expires ${l.expires_at.slice(0, 10)}` : "no expiry"}
                              </span>
                              {isOwner && isLinkActive(l) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-destructive"
                                  onClick={() => void handleRevokeView(l.id)}
                                >
                                  <BanIcon className="mr-1 size-3" />
                                  Revoke
                                </Button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {invites.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Collaborator invites</p>
                        <ul className="space-y-2 text-xs">
                          {invites.map((inv) => (
                            <li
                              key={inv.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 px-3 py-2"
                            >
                              <span className={isLinkActive(inv) ? "text-foreground" : "text-muted-foreground line-through"}>
                                {roleLabel(inv.role)} · {inv.uses_count} uses
                                {inv.max_uses != null ? ` / ${inv.max_uses}` : ""}
                                {inv.expires_at ? ` · exp ${inv.expires_at.slice(0, 10)}` : ""}
                              </span>
                              {isOwner && isLinkActive(inv) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-destructive"
                                  onClick={() => void handleRevokeInvite(inv.id)}
                                >
                                  <BanIcon className="mr-1 size-3" />
                                  Revoke
                                </Button>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only the trip owner can create or revoke share links.{" "}
                  <Link href={`/trips/${trip.id}/overview`} className="text-primary underline-offset-4 hover:underline">
                    Overview
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="group cursor-pointer border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-600">
                    <CreditCardIcon className="size-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-white/50 text-emerald-600 backdrop-blur-sm dark:bg-background/50"
                  >
                    Coming Soon
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-sm transition-colors group-hover:text-emerald-700">
                  Split Expenses
                </CardTitle>
                <CardDescription className="text-xs">
                  Track shared costs, settle up automatically in multiple currencies.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="group cursor-pointer border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-blue-500/5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-600">
                    <BriefcaseBusinessIcon className="size-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className="border-indigo-500/30 bg-white/50 text-indigo-600 backdrop-blur-sm dark:bg-background/50"
                  >
                    Live
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-sm transition-colors group-hover:text-indigo-700">
                  Packing list
                </CardTitle>
                <CardDescription className="text-xs">
                  Personal and group checklists are on the Packing tab.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
