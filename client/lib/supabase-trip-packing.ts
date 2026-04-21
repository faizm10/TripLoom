import { createClient } from "@/lib/supabase/client"

export type PackingScope = "group" | "personal"

export type PackingItem = {
  id: string
  tripId: string
  userId: string | null
  label: string
  isChecked: boolean
  sortOrder: number
}

type TripPackingRow = {
  id: string
  trip_id: string
  user_id: string | null
  label: string
  is_checked: boolean
  sort_order: number
}

function rowToItem(row: TripPackingRow): PackingItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    label: row.label ?? "",
    isChecked: Boolean(row.is_checked),
    sortOrder: Number(row.sort_order) || 0,
  }
}

export async function listGroupPackingItemsFromSupabase(tripId: string): Promise<PackingItem[]> {
  const supabase = createClient()
  const { data: rows, error } = await supabase
    .from("trip_packing_items")
    .select("*")
    .eq("trip_id", tripId)
    .is("user_id", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return ((rows ?? []) as TripPackingRow[]).map(rowToItem)
}

export async function listPersonalPackingItemsFromSupabase(tripId: string): Promise<PackingItem[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trip_packing_items")
    .select("*")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return ((rows ?? []) as TripPackingRow[]).map(rowToItem)
}

export type SavePackingItemPayload = {
  id: string
  label: string
  isChecked: boolean
  sortOrder: number
}

export async function savePackingItemToSupabase(
  tripId: string,
  payload: SavePackingItemPayload,
  scope: PackingScope
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save packing items.")

  const userId = scope === "group" ? null : user.id
  if (scope === "personal" && !userId) throw new Error("Missing user for personal packing.")

  const { error } = await supabase.from("trip_packing_items").upsert(
    {
      id: payload.id,
      trip_id: tripId,
      user_id: userId,
      label: payload.label.trim(),
      is_checked: payload.isChecked,
      sort_order: payload.sortOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
  if (error) throw new Error(error.message)
}

export async function updatePackingItemCheckedInSupabase(
  tripId: string,
  id: string,
  isChecked: boolean
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_packing_items")
    .update({ is_checked: isChecked, updated_at: new Date().toISOString() })
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deletePackingItemFromSupabase(tripId: string, id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("trip_packing_items").delete().eq("trip_id", tripId).eq("id", id)
  if (error) throw new Error(error.message)
}
