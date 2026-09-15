/*
# Add structured date columns to booking_requests

## Purpose
Add start_date and end_date columns (date type) to booking_requests so the form
can use a proper date picker instead of free-text. The existing requested_dates
text column is kept for backward compatibility.

## Changes
### booking_requests (modified)
- start_date (date, nullable) — first requested day
- end_date (date, nullable) — last requested day (same as start_date for single-day)

## Security
No policy changes — existing policies already cover the new columns.
*/

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;
