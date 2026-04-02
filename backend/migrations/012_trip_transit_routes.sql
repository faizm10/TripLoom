-- Saved transit routes (subway, bus, rail, etc.) linked to trips.
CREATE TABLE IF NOT EXISTS trip_transit_routes (
  id TEXT NOT NULL,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL DEFAULT 1,
  from_label TEXT NOT NULL DEFAULT '',
  to_label TEXT NOT NULL DEFAULT '',
  from_place_id TEXT NOT NULL DEFAULT '',
  to_place_id TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'rail',
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  departure_time_local TEXT NOT NULL DEFAULT '',
  arrival_time_local TEXT NOT NULL DEFAULT '',
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  provider TEXT NOT NULL DEFAULT 'manual' CHECK (provider IN ('google_maps', 'manual')),
  provider_route_ref TEXT NOT NULL DEFAULT '',
  reference_url TEXT NOT NULL DEFAULT '',
  transfers INTEGER NOT NULL DEFAULT 0,
  walking_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (trip_id, id)
);

CREATE INDEX IF NOT EXISTS idx_trip_transit_routes_trip_id ON trip_transit_routes(trip_id);

ALTER TABLE trip_transit_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read trip_transit_routes"
  ON trip_transit_routes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_transit_routes.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can insert trip_transit_routes"
  ON trip_transit_routes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_transit_routes.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can update trip_transit_routes"
  ON trip_transit_routes FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_transit_routes.trip_id AND trip_members.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_transit_routes.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can delete trip_transit_routes"
  ON trip_transit_routes FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_transit_routes.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

COMMENT ON TABLE trip_transit_routes IS 'Saved transit legs (subway, bus, rail, etc.) linked to trips.';
