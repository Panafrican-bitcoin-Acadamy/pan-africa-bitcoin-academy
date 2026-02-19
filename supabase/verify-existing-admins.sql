-- Verify existing admin accounts
-- This sets email_verified to true for all existing admins
-- Run this after running add-admin-security-features.sql

-- Verify all existing admins (set email_verified to true)
UPDATE admins
SET email_verified = true
WHERE email_verified IS NULL OR email_verified = false;

-- Clear any expired verification tokens
UPDATE admins
SET email_verification_token = NULL,
    email_verification_token_expiry = NULL
WHERE email_verification_token_expiry < NOW();

-- Show summary
SELECT 
  COUNT(*) as total_admins,
  COUNT(*) FILTER (WHERE email_verified = true) as verified_admins,
  COUNT(*) FILTER (WHERE email_verified = false) as unverified_admins,
  COUNT(*) FILTER (WHERE email_verified IS NULL) as null_verified
FROM admins;

