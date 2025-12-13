-- Chapter Progress Tracking Table
-- This table tracks which chapters students have completed/unlocked

CREATE TABLE IF NOT EXISTS chapter_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  chapter_slug TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_unlocked BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, chapter_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chapter_progress_student ON chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter ON chapter_progress(chapter_number);

-- Function to automatically unlock Chapter 1 for new enrolled students
CREATE OR REPLACE FUNCTION unlock_chapter_one_for_student()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- When a student record is created, unlock Chapter 1
  INSERT INTO chapter_progress (student_id, chapter_number, chapter_slug, is_unlocked, unlocked_at)
  VALUES (NEW.profile_id, 1, 'the-nature-of-money', TRUE, NOW())
  ON CONFLICT (student_id, chapter_number) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-unlock Chapter 1 when student is created
DROP TRIGGER IF EXISTS trigger_unlock_chapter_one ON students;
CREATE TRIGGER trigger_unlock_chapter_one
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION unlock_chapter_one_for_student();

-- Enable Row Level Security (RLS) to restrict access
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;

-- Restrictive Policy: Block ALL direct client access
-- Only API endpoints using service role (supabaseAdmin) can access
-- This ensures all access goes through secure API endpoints with proper authentication
CREATE POLICY "API only - no direct client access"
ON chapter_progress
FOR ALL
USING (false)
WITH CHECK (false);

