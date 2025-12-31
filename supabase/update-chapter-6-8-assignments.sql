-- ============================================================================
-- UPDATE/CREATE Chapter 6 and Chapter 8 Assignments
-- ============================================================================
-- This script creates or updates both assignments:
-- - Chapter 6: "First Wallet Proof" (200 sats)
-- - Chapter 8: "Create & Validate Bitcoin Addresses" (100 sats)
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- This script will INSERT if the assignment doesn't exist, or UPDATE if it does
-- ============================================================================

-- Chapter 6 Assignment: "First Wallet Proof"
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
  chapter_number = EXCLUDED.chapter_number,
  chapter_slug = EXCLUDED.chapter_slug,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 8 Assignment: "Create & Validate Bitcoin Addresses"
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
  '88888888-8888-4888-8888-888888888888', -- Deterministic UUID for Chapter 8 assignment
  'Assignment: Create & Validate Bitcoin Addresses',
  'Part A: Create one on-chain receive address and one Lightning receive request. Part B: Validate addresses by pasting correct and incorrect addresses in each field.',
  8,
  'exchange-software-wallet',
  'Part A: Create addresses. Part B: Validate addresses with correct and incorrect examples.',
  NULL,
  'INSTRUCTOR_REVIEW', -- Special value indicating this requires manual review
  'text',
  10,
  100, -- 100 sats reward (TBD - instructor review)
  'active',
  NULL, -- Available to all cohorts
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  chapter_number = EXCLUDED.chapter_number,
  chapter_slug = EXCLUDED.chapter_slug,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION: Check that assignments were created/updated correctly
-- ============================================================================
-- Run this query to verify:
-- SELECT id, title, chapter_number, chapter_slug, reward_sats, status
-- FROM assignments 
-- WHERE id IN ('66666666-6666-4666-8666-666666666666', '88888888-8888-4888-8888-888888888888')
-- ORDER BY chapter_number;
-- ============================================================================
-- Expected results:
-- - Chapter 6: "Assignment: First Wallet Proof", reward_sats = 200
-- - Chapter 8: "Assignment: Create & Validate Bitcoin Addresses", reward_sats = 100
-- ============================================================================

-- Note: When an instructor grades the "First Wallet Proof" assignment:
-- 1. Update assignment_submissions.status to 'graded'
-- 2. Set assignment_submissions.is_correct to true if approved
-- 3. Set assignment_submissions.points_earned to 10 (assignment.points)
-- 4. Award 200 sats reward via the sats rewards system
-- 5. Add feedback in assignment_submissions.feedback field

