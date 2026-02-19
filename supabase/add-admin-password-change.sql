-- Admin Password Change System Migration
-- This migration adds columns for password change requirement
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Add password change columns to admins table
-- ============================================================================

-- Track when password was last changed
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- Force password change on next login (for new admins with temporary passwords)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Auto-verify all existing admins (remove email verification requirement)
UPDATE admins 
SET email_verified = true 
WHERE email_verified IS NULL OR email_verified = false;

-- Set password_changed_at for existing admins (they've already set their passwords)
UPDATE admins 
SET password_changed_at = created_at 
WHERE password_changed_at IS NULL;

-- Set force_password_change to false for existing admins
UPDATE admins 
SET force_password_change = false 
WHERE force_password_change IS NULL;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN admins.password_changed_at IS 'Timestamp when admin last changed their password. NULL means password has never been changed (temporary password still in use)';
COMMENT ON COLUMN admins.force_password_change IS 'If true, admin must change password on next login. Set to true when creating new admin with temporary password';

