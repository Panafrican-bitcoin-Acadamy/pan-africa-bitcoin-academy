-- Create Chapter 20 Assignment: "Code or State"
-- This assignment requires instructor review (text submission)

INSERT INTO assignments (
  id,
  title,
  description,
  chapter_number,
  chapter_slug,
  question,
  search_address,
  correct_answer,
  answer_type,
  points,
  status,
  cohort_id,
  created_at,
  updated_at
) VALUES (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc', -- Deterministic UUID for Chapter 20 assignment
  'Assignment: Code or State',
  'Reflect on your perspective of Bitcoin after completing the course. What do you think of Bitcoin?',
  20,
  'why-bitcoin-philosophy-adoption',
  'What do you think of Bitcoin?',
  NULL,
  'INSTRUCTOR_REVIEW', -- Special value indicating this requires manual review
  'text',
  10,
  'active',
  NULL, -- Available to all cohorts
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  updated_at = NOW();

-- Note: When an instructor grades this assignment:
-- 1. Update assignment_submissions.status to 'graded'
-- 2. Set assignment_submissions.is_correct to true if approved
-- 3. Set assignment_submissions.points_earned to 10 (assignment.points)
-- 4. Award 100 sats reward via the sats rewards system
-- 5. Add feedback in assignment_submissions.feedback field

