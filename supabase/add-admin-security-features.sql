-- Admin Security Features Migration
-- This migration adds tables and columns for:
-- 1. Login attempt logging
-- 2. Account lockout tracking
-- 3. Email verification
-- 4. Password reset tokens
-- 5. Active sessions tracking
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. Add columns to admins table
-- ============================================================================

-- Email verification
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email_verification_token_expiry TIMESTAMP WITH TIME ZONE;

-- Account lockout
ALTER TABLE admins ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE;

-- Password reset (if not exists from profiles table pattern)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2. Login Attempts Logging Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  email TEXT NOT NULL, -- Store email even if admin not found (for security)
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT UNIQUE, -- Unique request identifier
  success BOOLEAN NOT NULL,
  failure_reason TEXT, -- e.g., 'invalid_password', 'account_locked', 'email_not_verified'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. Active Sessions Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL, -- Hashed session token
  ip_address TEXT,
  user_agent TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(admin_id, session_token)
);

-- ============================================================================
-- 4. Create Indexes for Performance
-- ============================================================================

-- Login attempts indexes
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_admin_id ON admin_login_attempts(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email ON admin_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip ON admin_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_created ON admin_login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_request_id ON admin_login_attempts(request_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_success ON admin_login_attempts(success);

-- Active sessions indexes
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_admin_id ON admin_active_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_token ON admin_active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_expires ON admin_active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_revoked ON admin_active_sessions(revoked);

-- Admins table indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_admins_email_verified ON admins(email_verified);
CREATE INDEX IF NOT EXISTS idx_admins_locked_until ON admins(locked_until);
CREATE INDEX IF NOT EXISTS idx_admins_email_verification_token ON admins(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_admins_password_reset_token ON admins(password_reset_token);

-- ============================================================================
-- 5. Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_active_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "API only - no direct client access - login_attempts" ON admin_login_attempts;
DROP POLICY IF EXISTS "API only - no direct client access - active_sessions" ON admin_active_sessions;

-- Restrictive Policy: Block ALL direct client access
-- Only API endpoints using service role (supabaseAdmin) can access
CREATE POLICY "API only - no direct client access - login_attempts"
  ON admin_login_attempts
  FOR ALL
  USING (false);

CREATE POLICY "API only - no direct client access - active_sessions"
  ON admin_active_sessions
  FOR ALL
  USING (false);

-- ============================================================================
-- 6. Function to clean up expired sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark expired sessions as revoked
  UPDATE admin_active_sessions
  SET revoked = true, revoked_at = NOW()
  WHERE expires_at < NOW() AND revoked = false;
  
  -- Delete very old sessions (older than 30 days)
  DELETE FROM admin_active_sessions
  WHERE expires_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================================================
-- 7. Function to clean up old login attempts
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete login attempts older than 90 days
  DELETE FROM admin_login_attempts
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- ============================================================================
-- 8. Comments for documentation
-- ============================================================================

COMMENT ON TABLE admin_login_attempts IS 'Logs all admin login attempts for security auditing';
COMMENT ON TABLE admin_active_sessions IS 'Tracks active admin sessions for session management';
COMMENT ON COLUMN admins.email_verified IS 'Whether admin email has been verified';
COMMENT ON COLUMN admins.failed_login_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN admins.locked_until IS 'Timestamp when account lockout expires';
COMMENT ON COLUMN admin_login_attempts.request_id IS 'Unique identifier for each login request for tracking';

