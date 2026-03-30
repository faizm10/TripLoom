-- Create the trip_documents table for managing uploaded files
CREATE TABLE IF NOT EXISTS trip_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Flight', 'Hotel', 'ID/Visa', 'Activity', 'Other')),
  file_size_bytes BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Establish RLS for trip_documents
ALTER TABLE trip_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can select documents"
  ON trip_documents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_documents.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can insert documents"
  ON trip_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_documents.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can delete documents"
  ON trip_documents FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_documents.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

-- Expand RLS on trip_members so trip members can see the full roster
CREATE POLICY "Members can read all members of their trips"
  ON trip_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_members.trip_id AND tm.user_id = auth.uid()::text
    )
  );

-- Note: We also require a Supabase Storage bucket named 'trip_documents'.
-- Ensure it is created manually in the Supabase Dashboard as public (or with storage RLS).
