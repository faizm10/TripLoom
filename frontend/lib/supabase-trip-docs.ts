import { createClient } from "@/lib/supabase/client"

export type Category = "Flight" | "Hotel" | "ID/Visa" | "Activity" | "Other"

export interface TripDocument {
  id: string
  trip_id: string
  name: string
  category: Category
  file_size_bytes: number
  file_type: string
  storage_path: string
  uploaded_by: string
  created_at: string
}

export async function getTripDocuments(tripId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trip_documents")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching trip documents:", error)
    return []
  }

  return data as TripDocument[]
}

export async function uploadTripDocument(
  tripId: string,
  file: File,
  category: Category
) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  if (!userId) throw new Error("Not authenticated")

  // Sanitize file name for storage
  const fileExt = file.name.split(".").pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${tripId}/${fileName}`

  // 1. Upload file to Supabase Storage bucket named 'trip_documents'
  const { error: uploadError } = await supabase.storage
    .from("trip_documents")
    .upload(filePath, file)

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  // 2. Create the database record
  const { data, error: dbError } = await supabase
    .from("trip_documents")
    .insert({
      trip_id: tripId,
      name: file.name,
      category,
      file_size_bytes: file.size,
      file_type: file.type.includes("pdf") ? "pdf" : file.type.includes("image") ? "image" : "doc",
      storage_path: filePath,
      uploaded_by: userId,
    })
    .select()
    .single()

  if (dbError) {
    // Attempt to rollback the storage upload if the DB insert fails
    await supabase.storage.from("trip_documents").remove([filePath])
    throw new Error(`Database insert failed: ${dbError.message}`)
  }

  return data as TripDocument
}

export async function deleteTripDocument(docId: string, storagePath: string) {
  const supabase = createClient()

  // 1. Delete from database
  const { error: dbError } = await supabase
    .from("trip_documents")
    .delete()
    .eq("id", docId)

  if (dbError) {
    throw new Error(`Failed to delete document record: ${dbError.message}`)
  }

  // 2. Delete from storage
  const { error: storageError } = await supabase.storage
    .from("trip_documents")
    .remove([storagePath])

  if (storageError) {
    console.error("Failed to delete file from storage bucket", storageError)
    // We don't throw here because the DB record is gone, so the app state is fine. 
    // It's just an orphaned file in the bucket.
  }
}

export async function getDocumentUrl(storagePath: string) {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from("trip_documents")
    .createSignedUrl(storagePath, 60 * 60) // 1 hour expiry

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`)
  }

  return data.signedUrl
}
