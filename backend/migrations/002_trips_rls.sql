-- RLS so the frontend (authenticated user) can create trips and add themselves as owner.
-- Run this in Supabase SQL editor or via your migration runner after 001_init.sql.

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert any trip (they are creating it).
CREATE POLICY "Authenticated can insert trips"
  ON trips FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can insert themselves into trip_members only.
CREATE POLICY "Authenticated can insert self as member"
  ON trip_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Allow users to read trips they are a member of (for future "load trips from Supabase").
CREATE POLICY "Members can read trips"
  ON trips FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid()::text
    )
  );

-- Allow users to read their own membership rows.
CREATE POLICY "Users can read own memberships"
  ON trip_members FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- Members can update trips they belong to (e.g. destination, dates, timezone).
CREATE POLICY "Members can update trips"
  ON trips FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid()::text
    )
  );

-- Members can delete trips they belong to (e.g. owner removing a trip).
CREATE POLICY "Members can delete trips"
  ON trips FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid()::text
    )
  );
