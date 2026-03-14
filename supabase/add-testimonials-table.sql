-- Student testimonials table
-- Stores testimonials from students that can be displayed on the impact page

CREATE TABLE IF NOT EXISTS student_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  testimonial TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_testimonials_student_id ON student_testimonials(student_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON student_testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON student_testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON student_testimonials(display_order);

-- Enable Row Level Security
ALTER TABLE student_testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid "already exists" errors, then recreate
DROP POLICY IF EXISTS "Allow public to view approved testimonials" ON student_testimonials;
DROP POLICY IF EXISTS "Block client inserts" ON student_testimonials;
DROP POLICY IF EXISTS "Block client updates" ON student_testimonials;
DROP POLICY IF EXISTS "Block client deletes" ON student_testimonials;

-- Policy: Allow public to SELECT approved testimonials (for display on website)
CREATE POLICY "Allow public to view approved testimonials" ON student_testimonials
  FOR SELECT
  USING (is_approved = true);

-- Policy: Block all INSERT operations from client (only service role can insert)
CREATE POLICY "Block client inserts" ON student_testimonials
  FOR INSERT
  WITH CHECK (false);

-- Policy: Block all UPDATE operations from client (only service role can update)
CREATE POLICY "Block client updates" ON student_testimonials
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Policy: Block all DELETE operations from client (only service role can delete)
CREATE POLICY "Block client deletes" ON student_testimonials
  FOR DELETE
  USING (false);

-- Add table and column comments for documentation
COMMENT ON TABLE student_testimonials IS 'Student testimonials for display on impact page. Linked to profiles.';
COMMENT ON COLUMN student_testimonials.student_id IS 'Foreign key linking to the student profile';
COMMENT ON COLUMN student_testimonials.testimonial IS 'The testimonial text/quote from the student';
COMMENT ON COLUMN student_testimonials.is_approved IS 'If false, testimonial is hidden from public display';
COMMENT ON COLUMN student_testimonials.is_featured IS 'If true, testimonial is prioritized in display';
COMMENT ON COLUMN student_testimonials.display_order IS 'Order for displaying testimonials (lower numbers appear first)';
