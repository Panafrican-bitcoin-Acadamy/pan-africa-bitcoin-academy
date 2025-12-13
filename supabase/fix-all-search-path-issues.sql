-- Fix: Set search_path for all functions with mutable search_path issues
-- This fixes the security issues: "Function has a role mutable search_path"
-- Run this in Supabase SQL Editor to update all affected functions

-- ============================================
-- Fix 1: update_updated_at_column function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- Fix 2: unlock_chapter_one_for_student function
-- ============================================
CREATE OR REPLACE FUNCTION unlock_chapter_one_for_student()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- When a student record is created, unlock Chapter 1
  INSERT INTO chapter_progress (student_id, chapter_number, chapter_slug, is_unlocked, unlocked_at)
  VALUES (NEW.profile_id, 1, 'the-nature-of-money', TRUE, NOW())
  ON CONFLICT (student_id, chapter_number) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================
-- Fix 3: is_student function
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
-- Verify all functions were updated correctly
-- ============================================
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname IN ('update_updated_at_column', 'unlock_chapter_one_for_student', 'is_student')
ORDER BY proname;

