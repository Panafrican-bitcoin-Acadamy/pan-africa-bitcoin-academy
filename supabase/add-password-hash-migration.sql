-- Migration: Add password_hash column to profiles table
-- Run this in Supabase SQL Editor if password_hash column doesn't exist

-- Add password_hash column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.password_hash IS 'Bcrypt hashed password for authentication';

-- Note: Existing profiles without passwords will need to set a password
-- Users with old-style hashes (hashed_*) will be automatically migrated on next login

