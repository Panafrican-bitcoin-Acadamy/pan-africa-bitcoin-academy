-- Create Chapter 17 Assignment: "Multi-Sig Simulator"
-- Run this in your Supabase SQL Editor to register the assignment in the database.
-- (setup-all-assignments.sql also includes this assignment.)

-- Ensure reward_sats column exists (safe to run if already present)
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS reward_sats INTEGER DEFAULT 200;

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
  '17171717-1717-4171-8171-717171717171',
  'Assignment: Multi-Sig Simulator',
  'Complete the Multi-Sig simulator: (1) Generate and verify a BIP39 seed phrase, (2) Exchange public key packages (MSKEY:Name:xpub), (3) Construct a 2-of-2 multisig descriptor. Seed stays in browser only; only xpubs are used.',
  17,
  'multi-sig-collaborative-custody',
  'Complete the 3-step Multi-Sig simulator and submit. Steps: seed creation & verification, key exchange, multisig construction.',
  NULL,
  'INSTRUCTOR_REVIEW',
  'text',
  10,
  200,
  'active',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();
