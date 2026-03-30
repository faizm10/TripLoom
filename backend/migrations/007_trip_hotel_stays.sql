CREATE TABLE IF NOT EXISTS trip_hotel_stays (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  check_in TEXT NOT NULL DEFAULT '',
  check_out TEXT NOT NULL DEFAULT '',
  address_note TEXT NOT NULL DEFAULT '',
  total_cost TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'CAD',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_hotel_stays_trip_id ON trip_hotel_stays(trip_id);

ALTER TABLE trip_hotel_stays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read trip_hotel_stays"
  ON trip_hotel_stays FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_hotel_stays.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can insert trip_hotel_stays"
  ON trip_hotel_stays FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_hotel_stays.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can update trip_hotel_stays"
  ON trip_hotel_stays FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_hotel_stays.trip_id AND trip_members.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_hotel_stays.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can delete trip_hotel_stays"
  ON trip_hotel_stays FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_hotel_stays.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );
