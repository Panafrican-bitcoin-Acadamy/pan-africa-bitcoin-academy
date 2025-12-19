-- Assignments and Assignment Submissions Tables
-- Run this in your Supabase SQL Editor

-- Assignments table (stores assignment definitions)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  chapter_number INTEGER, -- Link to chapter (optional)
  chapter_slug TEXT, -- Link to chapter slug (optional)
  question TEXT NOT NULL, -- The assignment question/prompt
  search_address TEXT, -- Address or txid to search for (for Explorer Scavenger Hunt type)
  correct_answer TEXT NOT NULL, -- The correct answer (e.g., "Bitcoin Pizza day")
  answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'number', 'multiple_choice')),
  points INTEGER DEFAULT 10, -- Points awarded for completion
  due_date TIMESTAMP WITH TIME ZONE, -- Optional due date
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL, -- If NULL, assignment is for all cohorts
  created_by UUID REFERENCES profiles(id), -- Admin who created the assignment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment submissions table (tracks student submissions)
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL, -- Student's submitted answer
  is_correct BOOLEAN DEFAULT false, -- Whether the answer is correct
  points_earned INTEGER DEFAULT 0, -- Points earned for this submission
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  feedback TEXT, -- Optional feedback from admin
  graded_by UUID REFERENCES profiles(id), -- Admin who graded (if manual grading)
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id) -- One submission per student per assignment
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assignments_chapter ON assignments(chapter_number);
CREATE INDEX IF NOT EXISTS idx_assignments_chapter_slug ON assignments(chapter_slug);
CREATE INDEX IF NOT EXISTS idx_assignments_cohort ON assignments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_at ON assignment_submissions(submitted_at DESC);

-- Trigger to update updated_at timestamp for assignments
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for assignment_submissions
CREATE TRIGGER update_assignment_submissions_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active assignments
CREATE POLICY "Anyone can view active assignments"
  ON assignments FOR SELECT
  USING (status = 'active');

-- Only admins can insert/update/delete assignments
CREATE POLICY "Only admins can manage assignments"
  ON assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- RLS Policies for assignment_submissions table
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions"
  ON assignment_submissions FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Students can insert their own submissions
CREATE POLICY "Students can submit assignments"
  ON assignment_submissions FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM profiles WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON assignment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins can update submissions (for grading)
CREATE POLICY "Admins can grade submissions"
  ON assignment_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Comments
COMMENT ON TABLE assignments IS 'Stores assignment definitions including questions, correct answers, and due dates';
COMMENT ON TABLE assignment_submissions IS 'Tracks student submissions for assignments with automatic answer validation';
COMMENT ON COLUMN assignments.search_address IS 'Address or txid to search for (used for Explorer Scavenger Hunt type assignments)';
COMMENT ON COLUMN assignments.correct_answer IS 'The correct answer that students need to provide';
COMMENT ON COLUMN assignment_submissions.is_correct IS 'Automatically set based on answer comparison with correct_answer';
