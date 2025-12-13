-- Optimized Database Schema for Pan-Africa Bitcoin Academy
-- Run this to update your existing schema
-- This removes student_id and simplifies the profiles table

-- ============================================
-- 1. UPDATE PROFILES TABLE - Remove student_id
-- ============================================

-- Drop the student_id column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS student_id;

-- Remove the unique constraint on student_id if it exists
DROP INDEX IF EXISTS idx_profiles_student_id;

-- Add password field (we'll store hashed passwords)
-- Note: In production, use Supabase Auth instead of storing passwords
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ============================================
-- 2. UPDATE INDEXES
-- ============================================

-- Remove student_id index (already dropped above)
-- Keep email index
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- 3. CREATE STORAGE BUCKET FOR PROFILE IMAGES
-- ============================================
-- Note: Run this in Supabase Dashboard > Storage
-- Or use the Supabase client to create buckets programmatically

-- Storage bucket creation SQL (run in Supabase SQL Editor):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_img', 'profile_img', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy to allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_img');

-- Storage policy to allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile_img' AND
  auth.role() = 'authenticated'
);

-- Storage policy to allow users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile_img'
);
*/

-- ============================================
-- 4. HELPER FUNCTION TO CHECK IF USER IS STUDENT
-- ============================================

CREATE OR REPLACE FUNCTION is_student(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  student_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM students WHERE profile_id = profile_uuid
  ) INTO student_exists;
  
  RETURN student_exists;
END;
$$;

-- ============================================
-- 5. UPDATE COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles with authentication. Uses UUID as primary identifier. No student_id needed.';
COMMENT ON COLUMN profiles.id IS 'Primary identifier for the profile. Use this instead of student_id.';
COMMENT ON COLUMN profiles.password_hash IS 'Hashed password (use Supabase Auth in production instead)';

