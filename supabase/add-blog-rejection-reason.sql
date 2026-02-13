-- Add rejection_reason column to blog_submissions table
-- This column stores the reason why a blog submission was rejected
-- Run this script in your Supabase SQL Editor

-- Add the rejection_reason column if it doesn't exist
ALTER TABLE blog_submissions 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN blog_submissions.rejection_reason IS 'Reason provided by admin when rejecting a blog submission. Maximum length: 1000 characters.';

-- Optional: Add a check constraint to limit the length (if needed)
-- ALTER TABLE blog_submissions 
-- ADD CONSTRAINT check_rejection_reason_length 
-- CHECK (rejection_reason IS NULL OR LENGTH(rejection_reason) <= 1000);

-- Note: The check constraint is commented out to allow flexibility
-- The application layer will enforce the 1000 character limit

