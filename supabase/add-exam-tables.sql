-- Final Exam System Tables
-- This creates tables for exam access control and results tracking

-- Exam Access Table: Tracks which students have been granted access by admin
CREATE TABLE IF NOT EXISTS exam_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id), -- Admin who granted access
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id) -- Each student can only have one access record
);

-- Exam Results Table: Stores exam submissions and scores
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- Score out of 50
  total_questions INTEGER DEFAULT 50,
  answers JSONB NOT NULL, -- Store all 50 answers: {"1": "C", "2": "B", ...}
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id) -- Each student can only take the exam once
);

-- Add exam_score column to students table (for quick access)
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_score INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS exam_completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_access_student ON exam_access(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_score ON exam_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_students_exam_score ON students(exam_score);

-- Enable Row Level Security (RLS)
ALTER TABLE exam_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Restrictive Policy: Block ALL direct client access
-- Only API endpoints using service role (supabaseAdmin) can access
CREATE POLICY "API only - no direct client access - exam_access"
ON exam_access
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "API only - no direct client access - exam_results"
ON exam_results
FOR ALL
USING (false)
WITH CHECK (false);
