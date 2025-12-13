-- Fix: Set search_path for update_updated_at_column function
-- This fixes the security issue: "Function has a role mutable search_path"
-- Run this in Supabase SQL Editor to update the existing function

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

-- Verify the function was updated correctly
-- This query should show the search_path is set
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

