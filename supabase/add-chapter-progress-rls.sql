-- Add Row Level Security (RLS) to chapter_progress table
-- This restricts ALL direct access - only API endpoints (using service role) can access

-- Enable RLS on chapter_progress table
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;

-- Restrictive Policy: Block ALL direct client access
-- Only API endpoints using supabaseAdmin (service role) can access
-- This ensures all access goes through your secure API endpoints
CREATE POLICY "API only - no direct client access"
ON chapter_progress
FOR ALL
USING (false)
WITH CHECK (false);

-- Note: This policy blocks all direct Supabase client access
-- Your API endpoints use supabaseAdmin (service role) which bypasses RLS
-- This is the most secure approach - all access must go through your API

