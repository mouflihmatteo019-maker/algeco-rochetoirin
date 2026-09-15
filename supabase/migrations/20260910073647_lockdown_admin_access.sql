-- Create an admins table that explicitly lists who is allowed to manage bookings/calendar
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read the admins table (needed for RLS subqueries
-- in policies on other tables). No one can INSERT/UPDATE/DELETE via the API —
-- admin entries are managed exclusively via SQL.
DROP POLICY IF EXISTS "read_admins" ON admins;
CREATE POLICY "read_admins" ON admins FOR SELECT
  TO authenticated USING (true);

-- ── Tighten booking_requests policies ──
-- INSERT stays public (visitors submit requests without an account)
-- SELECT / UPDATE / DELETE now require the caller to be in the admins table

DROP POLICY IF EXISTS "admin_select_booking_requests" ON booking_requests;
CREATE POLICY "admin_select_booking_requests" ON booking_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_update_booking_requests" ON booking_requests;
CREATE POLICY "admin_update_booking_requests" ON booking_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_delete_booking_requests" ON booking_requests;
CREATE POLICY "admin_delete_booking_requests" ON booking_requests FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

-- ── Tighten calendar_blocks policies ──
-- SELECT stays public (visitors see availability)
-- INSERT / UPDATE / DELETE now require admin membership

DROP POLICY IF EXISTS "admin_insert_calendar_blocks" ON calendar_blocks;
CREATE POLICY "admin_insert_calendar_blocks" ON calendar_blocks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_update_calendar_blocks" ON calendar_blocks;
CREATE POLICY "admin_update_calendar_blocks" ON calendar_blocks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_delete_calendar_blocks" ON calendar_blocks;
CREATE POLICY "admin_delete_calendar_blocks" ON calendar_blocks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );
