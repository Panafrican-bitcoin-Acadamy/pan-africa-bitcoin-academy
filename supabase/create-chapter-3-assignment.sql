-- Create Chapter 3 Assignment: "Inflation Reality Check"
-- This assignment requires instructor review (text submission)

-- Insert the assignment
-- Using a deterministic UUID based on chapter 3 assignment
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
  '33333333-3333-4333-8333-333333333333', -- Deterministic UUID for Chapter 3 assignment
  'Assignment: Inflation Reality Check',
  'Research and compare prices to understand inflation''s impact on purchasing power. Compare the price of one everyday item (bread, sugar, fuel) today vs 10–20 years ago.',
  3,
  'problems-with-traditional-fiat-money',
  'Compare the price of one everyday item (bread, sugar, fuel) today vs 10–20 years ago.',
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
-- 4. Award 75 sats reward via the sats rewards system
-- 5. Add feedback in assignment_submissions.feedback field

