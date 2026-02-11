-- Add rejection_reason column to blog_submissions table
-- This column stores the reason why a blog submission was rejected

ALTER TABLE blog_submissions 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN blog_submissions.rejection_reason IS 'Reason provided by admin when rejecting a blog submission';

