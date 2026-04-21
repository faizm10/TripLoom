"use server"

import { createClient } from "@/lib/supabase/server"
import { generateShareToken, hashShareToken } from "@/lib/trip-share-token"

async function assertTripOwner(tripId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("You must be signed in.")
  }
  const { data: row, error } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (error || row?.role !== "owner") {
    throw new Error("Only the trip owner can manage share links.")
  }
  return { supabase, userId: user.id }
}

function expiresAtFromDays(days: number | null | undefined): string | null {
  if (days == null || days <= 0) return null
  return new Date(Date.now() + days * 86400000).toISOString()
}

export async function getTripMemberRoleAction(
  tripId: string
): Promise<"owner" | "editor" | "viewer" | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle()
  const r = data?.role
  if (r === "owner" || r === "editor" || r === "viewer") return r
  return null
}

export type TripShareLinkSummary = {
  id: string
  label: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export type TripCollaboratorInviteSummary = {
  id: string
  role: string
  expires_at: string | null
  revoked_at: string | null
  max_uses: number | null
  uses_count: number
  created_at: string
}

export async function listTripShareLinksAction(tripId: string): Promise<TripShareLinkSummary[]> {
  await assertTripOwner(tripId)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trip_share_links")
    .select("id, label, expires_at, revoked_at, created_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TripShareLinkSummary[]
}

export async function listTripCollaboratorInvitesAction(
  tripId: string
): Promise<TripCollaboratorInviteSummary[]> {
  await assertTripOwner(tripId)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trip_collaborator_invites")
    .select("id, role, expires_at, revoked_at, max_uses, uses_count, created_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as TripCollaboratorInviteSummary[]
}

export async function createTripViewShareLinkAction(
  tripId: string,
  input?: { label?: string; expiresInDays?: number | null }
): Promise<{ token: string; sharePath: string }> {
  const { supabase, userId } = await assertTripOwner(tripId)
  const raw = generateShareToken()
  const token_hash = hashShareToken(raw)
  const { error } = await supabase.from("trip_share_links").insert({
    trip_id: tripId,
    token_hash,
    label: input?.label?.trim() || null,
    expires_at: expiresAtFromDays(input?.expiresInDays ?? null),
    created_by: userId,
  })
  if (error) throw new Error(error.message)
  return {
    token: raw,
    sharePath: `/share/${encodeURIComponent(raw)}`,
  }
}

export async function createTripCollaboratorInviteAction(
  tripId: string,
  input?: {
    role?: "editor" | "viewer"
    expiresInDays?: number | null
    maxUses?: number | null
  }
): Promise<{ token: string; invitePath: string }> {
  const { supabase, userId } = await assertTripOwner(tripId)
  const raw = generateShareToken()
  const token_hash = hashShareToken(raw)
  const { error } = await supabase.from("trip_collaborator_invites").insert({
    trip_id: tripId,
    token_hash,
    role: input?.role ?? "editor",
    expires_at: expiresAtFromDays(input?.expiresInDays ?? 7),
    max_uses: input?.maxUses != null && input.maxUses > 0 ? input.maxUses : null,
    created_by: userId,
  })
  if (error) throw new Error(error.message)
  return {
    token: raw,
    invitePath: `/invite/${encodeURIComponent(raw)}`,
  }
}

export async function revokeTripShareLinkAction(linkId: string, tripId: string): Promise<void> {
  await assertTripOwner(tripId)
  const supabase = await createClient()
  const { error } = await supabase
    .from("trip_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("trip_id", tripId)
  if (error) throw new Error(error.message)
}

export async function revokeTripCollaboratorInviteAction(
  inviteId: string,
  tripId: string
): Promise<void> {
  await assertTripOwner(tripId)
  const supabase = await createClient()
  const { error } = await supabase
    .from("trip_collaborator_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("trip_id", tripId)
  if (error) throw new Error(error.message)
}
