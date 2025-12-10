-- Migration: Add password reset columns to profiles table
-- Run this in Supabase SQL Editor

-- Add reset_token column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token TEXT;

-- Add reset_token_expiry column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON profiles(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token_expiry ON profiles(reset_token_expiry) WHERE reset_token_expiry IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.reset_token IS 'Secure token for password reset (expires after 1 hour)';
COMMENT ON COLUMN profiles.reset_token_expiry IS 'Expiration timestamp for password reset token';

