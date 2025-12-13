-- Fix: Set search_path for is_student function
-- This fixes the security issue: "Function has a role mutable search_path"
-- Run this in Supabase SQL Editor to update the existing function

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

-- Verify the function was updated correctly
-- This query should show the search_path is set
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname = 'is_student';

