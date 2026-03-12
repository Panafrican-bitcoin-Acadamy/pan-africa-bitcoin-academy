-- Create the Explorer Scavenger Hunt assignment (Chapter 12: Verify for Yourself)
-- Run this in your Supabase SQL Editor (or use setup-all-assignments.sql which includes this)

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS reward_sats INTEGER DEFAULT 200;

INSERT INTO assignments (
  id,
  title,
  description,
  question,
  search_address,
  correct_answer,
  answer_type,
  chapter_number,
  chapter_slug,
  points,
  reward_sats,
  status,
  cohort_id,
  created_at,
  updated_at
) VALUES (
  '12121212-1212-4121-8121-212121212121',
  'Explorer Scavenger Hunt',
  'Practice using block explorers to find information about Bitcoin transactions',
  'Search for what this address belongs to: a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d',
  'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d',
  'Bitcoin Pizza day',
  'text',
  12,
  'verify-for-yourself-block-explorers-nodes',
  10,
  100,
  'active',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  search_address = EXCLUDED.search_address,
  correct_answer = EXCLUDED.correct_answer,
  chapter_slug = EXCLUDED.chapter_slug,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();
