-- Domestic vs international trips; ground transport (bus/train) for domestic only.
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS travel_scope TEXT NOT NULL DEFAULT 'international';

ALTER TABLE trips
  DROP CONSTRAINT IF EXISTS trips_travel_scope_check;

ALTER TABLE trips
  ADD CONSTRAINT trips_travel_scope_check
  CHECK (travel_scope IN ('domestic', 'international'));

CREATE TABLE IF NOT EXISTS trip_ground_trips (
  id TEXT NOT NULL,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('outbound', 'inbound', 'one_way', 'other')),
  route TEXT NOT NULL DEFAULT '',
  travel_date TEXT NOT NULL DEFAULT '',
  departure TEXT NOT NULL DEFAULT '',
  arrival TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  operator TEXT NOT NULL DEFAULT '',
  service_number TEXT NOT NULL DEFAULT '',
  cost TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (trip_id, id)
);

CREATE INDEX IF NOT EXISTS idx_trip_ground_trips_trip_id ON trip_ground_trips(trip_id);

ALTER TABLE trip_ground_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read trip_ground_trips"
  ON trip_ground_trips FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_ground_trips.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can insert trip_ground_trips"
  ON trip_ground_trips FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_ground_trips.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can update trip_ground_trips"
  ON trip_ground_trips FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_ground_trips.trip_id AND trip_members.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_ground_trips.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can delete trip_ground_trips"
  ON trip_ground_trips FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_ground_trips.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

COMMENT ON COLUMN trips.travel_scope IS 'domestic: flights optional if bus/train logged; international: flights only in nav.';
COMMENT ON TABLE trip_ground_trips IS 'Saved bus/train legs for domestic trips.';
