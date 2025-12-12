-- Add student data fields to students table
-- Students table becomes the source of truth for all student information
-- Run this in Supabase SQL Editor

ALTER TABLE students
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Enrolled'; -- Enrolled, Active, Graduated, etc.

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_cohort ON students(cohort_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Add comments
COMMENT ON COLUMN students.name IS 'Student full name (source of truth)';
COMMENT ON COLUMN students.email IS 'Student email (source of truth)';
COMMENT ON COLUMN students.phone IS 'Student phone number (source of truth)';
COMMENT ON COLUMN students.country IS 'Student country (source of truth)';
COMMENT ON COLUMN students.city IS 'Student city (source of truth)';
COMMENT ON COLUMN students.cohort_id IS 'Enrolled cohort (source of truth)';
COMMENT ON COLUMN students.status IS 'Student enrollment status (source of truth)';


