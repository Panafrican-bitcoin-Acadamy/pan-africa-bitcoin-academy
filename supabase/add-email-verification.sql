-- Email Verification System
-- Adds email verification fields to profiles table

-- Add email verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verification_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Note: Existing users will have NULL email_verified_at, which means they are considered verified
-- (grandfathered in). Only new registrations will need to verify.

