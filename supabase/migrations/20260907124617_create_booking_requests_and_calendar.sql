/*
# Create booking_requests and calendar_blocks tables

## Purpose
This migration creates the data layer for the ETS Laurent Mathieu showcase site.
It stores booking requests submitted by visitors (never instant reservations) and
calendar blocks managed by the administrator to mark dates as unavailable/reserved.

## New Tables

### booking_requests
Stores booking inquiries submitted from the public form.
- id (uuid, primary key)
- requested_dates (text, not null) — free-form or comma-separated dates the visitor wants
- start_time (text, not null) — desired start hour (e.g. "09:00")
- end_time (text, not null) — desired end hour (e.g. "17:00")
- need_type (text, not null) — type of need (reunion, association, evenement, professionnel, autre)
- people_count (integer, not null) — number of expected people
- name (text, not null) — requester's full name
- phone (text, not null) — phone number
- email (text, not null) — email address
- message (text) — optional additional message
- status (text, not null, default 'pending') — pending | accepted | refused
- admin_notes (text) — internal notes added by admin
- created_at (timestamptz, default now())

### calendar_blocks
Stores date ranges that the admin marks as unavailable (reserved, maintenance, etc.).
- id (uuid, primary key)
- start_date (date, not null) — first blocked date
- end_date (date, not null) — last blocked date
- label (text) — optional label (e.g. "Réservé", "Maintenance")
- status (text, not null, default 'blocked') — blocked | reserved
- created_at (timestamptz, default now())

## Security
- RLS enabled on both tables.
- booking_requests: public can INSERT (submit a request) and SELECT their own is not needed
  since there's no login for visitors. Admin uses authenticated role. Public INSERT only.
  SELECT/UPDATE/DELETE restricted to authenticated (admin).
- calendar_blocks: public can SELECT (to see availability). INSERT/UPDATE/DELETE restricted
  to authenticated (admin).

## Policy Summary
1. booking_requests:
   - INSERT: TO anon, authenticated WITH CHECK (true) — anyone can submit a request
   - SELECT: TO authenticated USING (true) — admin can see all requests
   - UPDATE: TO authenticated USING (true) WITH CHECK (true) — admin can update status
   - DELETE: TO authenticated USING (true) — admin can delete requests
2. calendar_blocks:
   - SELECT: TO anon, authenticated USING (true) — public can see availability
   - INSERT: TO authenticated WITH CHECK (true) — admin can create blocks
   - UPDATE: TO authenticated USING (true) WITH CHECK (true) — admin can update blocks
   - DELETE: TO authenticated USING (true) — admin can delete blocks
*/

-- booking_requests table
CREATE TABLE IF NOT EXISTS booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_dates text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  need_type text NOT NULL,
  people_count integer NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_booking_requests" ON booking_requests;
CREATE POLICY "public_insert_booking_requests"
ON booking_requests FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_booking_requests" ON booking_requests;
CREATE POLICY "admin_select_booking_requests"
ON booking_requests FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_booking_requests" ON booking_requests;
CREATE POLICY "admin_update_booking_requests"
ON booking_requests FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_booking_requests" ON booking_requests;
CREATE POLICY "admin_delete_booking_requests"
ON booking_requests FOR DELETE
TO authenticated USING (true);

-- calendar_blocks table
CREATE TABLE IF NOT EXISTS calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  label text,
  status text NOT NULL DEFAULT 'blocked',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_calendar_blocks" ON calendar_blocks;
CREATE POLICY "public_select_calendar_blocks"
ON calendar_blocks FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_calendar_blocks" ON calendar_blocks;
CREATE POLICY "admin_insert_calendar_blocks"
ON calendar_blocks FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_calendar_blocks" ON calendar_blocks;
CREATE POLICY "admin_update_calendar_blocks"
ON calendar_blocks FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_calendar_blocks" ON calendar_blocks;
CREATE POLICY "admin_delete_calendar_blocks"
ON calendar_blocks FOR DELETE
TO authenticated USING (true);

-- Index for sorting requests by creation date
CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_dates ON calendar_blocks (start_date, end_date);