-- Create Chapter 6 Assignment: "First Wallet Proof"
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
  reward_sats,
  status,
  cohort_id,
  created_at,
  updated_at
) VALUES (
  '66666666-6666-4666-8666-666666666666', -- Deterministic UUID for Chapter 6 assignment
  'Assignment: First Wallet Proof',
  'Hands-on practice with wallet creation, backup, and recovery. Create a wallet, back up seed securely, restore it (dry run). Reflection: What went wrong or surprised you?',
  6,
  'keys-and-transactions',
  'Create a wallet, back up seed securely, restore it (dry run). Reflection: What went wrong or surprised you?',
  NULL,
  'INSTRUCTOR_REVIEW', -- Special value indicating this requires manual review
  'text',
  10,
  200, -- 200 sats reward
  'active',
  NULL, -- Available to all cohorts
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Note: When an instructor grades this assignment:
-- 1. Update assignment_submissions.status to 'graded'
-- 2. Set assignment_submissions.is_correct to true if approved
-- 3. Set assignment_submissions.points_earned to 10 (assignment.points)
-- 4. Award 200 sats reward via the sats rewards system
-- 5. Add feedback in assignment_submissions.feedback field

