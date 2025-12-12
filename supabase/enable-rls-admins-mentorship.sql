-- Enable RLS on admins and mentorship_applications tables
-- Run this if you already created the tables without RLS

-- Enable RLS on admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "API only - no direct client access" ON admins;

-- Block all direct client access - only service role (supabaseAdmin) can access
CREATE POLICY "API only - no direct client access" ON admins
  FOR ALL USING (false) WITH CHECK (false);

-- Enable RLS on mentorship_applications table
ALTER TABLE mentorship_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to submit applications" ON mentorship_applications;
DROP POLICY IF EXISTS "API only - no direct client read/update" ON mentorship_applications;
DROP POLICY IF EXISTS "API only - no direct client update" ON mentorship_applications;
DROP POLICY IF EXISTS "API only - no direct client delete" ON mentorship_applications;

-- Allow public INSERT (for application submissions) but block SELECT/UPDATE/DELETE
CREATE POLICY "Allow public to submit applications" ON mentorship_applications
  FOR INSERT WITH CHECK (true);

-- Block all other direct client access - only service role (supabaseAdmin) can read/update
CREATE POLICY "API only - no direct client read/update" ON mentorship_applications
  FOR SELECT USING (false);
CREATE POLICY "API only - no direct client update" ON mentorship_applications
  FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "API only - no direct client delete" ON mentorship_applications
  FOR DELETE USING (false);


