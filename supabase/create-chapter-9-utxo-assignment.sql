-- Create the "Choose the Correct UTXOs" assignment for Chapter 9
-- Run this in your Supabase SQL Editor

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
  '99999999-9999-4999-8999-999999999999',
  'Assignment: Choose the Correct UTXOs',
  'Interactive exercise where students select the optimal UTXOs to spend for a given payment amount, learning about fee efficiency and change outputs.',
  'You have UTXOs: A (0.010 BTC), B (0.004 BTC), C (0.002 BTC). You want to send 0.006 BTC. Transaction fee: 0.0002 BTC per input. Which UTXOs should you use?',
  NULL,
  'INSTRUCTOR_REVIEW',
  'text',
  9,
  'utxos-fees-coin-control',
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
  chapter_number = EXCLUDED.chapter_number,
  chapter_slug = EXCLUDED.chapter_slug,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Verify the assignment was created
SELECT id, title, chapter_number, chapter_slug, reward_sats, status 
FROM assignments 
WHERE id = '99999999-9999-4999-8999-999999999999';



