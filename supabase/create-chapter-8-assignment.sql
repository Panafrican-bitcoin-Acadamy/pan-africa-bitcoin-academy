-- Create Chapter 8 Assignment: "Create & Validate Bitcoin Addresses"
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
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

