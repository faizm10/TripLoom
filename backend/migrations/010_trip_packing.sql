-- Personal (per-member) and shared group packing checklists per trip.
CREATE TABLE IF NOT EXISTS trip_packing_items (
  id TEXT NOT NULL,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE (trip_id, id)
);

CREATE INDEX IF NOT EXISTS idx_trip_packing_items_trip_user ON trip_packing_items (trip_id, user_id);

ALTER TABLE trip_packing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read trip_packing_items"
  ON trip_packing_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_packing_items.trip_id AND trip_members.user_id = auth.uid()::text
    )
    AND (
      trip_packing_items.user_id IS NULL
      OR trip_packing_items.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can insert trip_packing_items"
  ON trip_packing_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_packing_items.trip_id AND trip_members.user_id = auth.uid()::text
    )
    AND (
      trip_packing_items.user_id IS NULL
      OR trip_packing_items.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can update trip_packing_items"
  ON trip_packing_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_packing_items.trip_id AND trip_members.user_id = auth.uid()::text
    )
    AND (
      trip_packing_items.user_id IS NULL
      OR trip_packing_items.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_packing_items.trip_id AND trip_members.user_id = auth.uid()::text
    )
    AND (
      trip_packing_items.user_id IS NULL
      OR trip_packing_items.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Members can delete trip_packing_items"
  ON trip_packing_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_packing_items.trip_id AND trip_members.user_id = auth.uid()::text
    )
    AND (
      trip_packing_items.user_id IS NULL
      OR trip_packing_items.user_id = auth.uid()::text
    )
  );

COMMENT ON TABLE trip_packing_items IS 'Packing rows: user_id NULL = shared group list; non-null = personal for that member.';
