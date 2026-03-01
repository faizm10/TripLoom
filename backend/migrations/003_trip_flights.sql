-- Saved flight choices per trip. One row per saved flight (outbound/inbound or one-way).
CREATE TABLE IF NOT EXISTS trip_flights (
  id TEXT NOT NULL,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('outbound', 'inbound', 'one_way')),
  route TEXT NOT NULL DEFAULT '',
  flight_date TEXT NOT NULL DEFAULT '',
  departure TEXT NOT NULL DEFAULT '',
  arrival TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  stops TEXT NOT NULL DEFAULT '',
  airline TEXT NOT NULL DEFAULT '',
  cost TEXT NOT NULL DEFAULT '',
  offer_id TEXT,
  book_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (trip_id, id)
);

CREATE INDEX IF NOT EXISTS idx_trip_flights_trip_id ON trip_flights(trip_id);

ALTER TABLE trip_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read trip_flights"
  ON trip_flights FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_flights.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can insert trip_flights"
  ON trip_flights FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_flights.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can delete trip_flights"
  ON trip_flights FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_flights.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );

COMMENT ON TABLE trip_flights IS 'Saved flight choices per trip; used by flights page.';
