-- Fix: Set search_path for unlock_chapter_one_for_student function
-- This fixes the security issue: "Function has a role mutable search_path"
-- Run this in Supabase SQL Editor to update the existing function

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

-- Verify the function was updated correctly
-- This query should show the search_path is set
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname = 'unlock_chapter_one_for_student';

