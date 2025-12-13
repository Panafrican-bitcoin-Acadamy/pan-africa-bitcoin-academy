-- Add certificate_image_url field to students table
-- This is an optional field for students to upload their photo for certificates
-- If they upload it, it can also be used as their profile picture

ALTER TABLE students
ADD COLUMN IF NOT EXISTS certificate_image_url TEXT;

-- Add comment
COMMENT ON COLUMN students.certificate_image_url IS 'Optional URL to student photo for certificate purposes. Can also be used as profile picture.';


