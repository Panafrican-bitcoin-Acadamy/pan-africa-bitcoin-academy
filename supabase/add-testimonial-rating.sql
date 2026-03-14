-- Add rating column to student_testimonials (1-5 stars)
ALTER TABLE student_testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5);

-- Add index for rating
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON student_testimonials(rating);

COMMENT ON COLUMN student_testimonials.rating IS 'Star rating 1-5 given by the student';
