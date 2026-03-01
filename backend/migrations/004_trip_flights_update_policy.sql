-- Allow trip members to update trip_flights (e.g. edit date).
CREATE POLICY "Members can update trip_flights"
  ON trip_flights FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_flights.trip_id AND trip_members.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_flights.trip_id AND trip_members.user_id = auth.uid()::text
    )
  );
