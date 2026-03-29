-- Extend trips table so Overview UI (destination/dates/travelers) persists.
-- Existing columns: destination, start_date, end_date, timezone

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS travelers INTEGER NOT NULL DEFAULT 1;

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS is_group_trip BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS total_days INTEGER NOT NULL DEFAULT 1;

