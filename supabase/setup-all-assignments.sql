-- ============================================================================
-- MASTER SCRIPT: Setup All Assignments
-- ============================================================================
-- This script runs the migration first, then creates all assignments
-- Run this script in your Supabase SQL editor
-- ============================================================================

-- STEP 1: Add reward_sats column to assignments table (if not exists)
-- ============================================================================
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS reward_sats INTEGER DEFAULT 200;

COMMENT ON COLUMN assignments.reward_sats IS 'Amount of sats awarded for completing this assignment correctly';

-- ============================================================================
-- STEP 2: Create all assignments
-- ============================================================================

-- Chapter 1: The Nature of Money
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Assignment: "What Is Money to Me?"',
  'Reflect on how money functions in your daily life and community. Write 5-7 sentences answering what problem money solves in your community.',
  1, 'the-nature-of-money',
  'Write 5-7 sentences answering: What problem does money solve in my community?',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 50, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 2: The Journey of Money
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  'Assignment: Money Under Pressure',
  'Reflect on your experiences or observations of traditional money systems failing. Write about how you saw old money fail.',
  2, 'the-journey-of-money',
  'Write about how you saw old money fail.',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 75, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 3: Problems with Fiat Money
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '33333333-3333-4333-8333-333333333333',
  'Assignment: Inflation Reality Check',
  'Research and compare prices to understand inflation''s impact on purchasing power. Compare the price of one everyday item (bread, sugar, fuel) today vs 10–20 years ago.',
  3, 'problems-with-traditional-fiat-money',
  'Compare the price of one everyday item (bread, sugar, fuel) today vs 10–20 years ago.',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 75, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 4: Crisis to Innovation
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '44444444-4444-4444-8444-444444444444',
  'Assignment: "What Broke?"',
  'Reflect on the failures of the traditional financial system. Explain in your own words one reason the old system failed (inflation, debt, bailouts, control).',
  4, 'from-crisis-to-innovation',
  'Explain in your own words one reason the old system failed (inflation, debt, bailouts, control).',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 75, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 5: Birth of Bitcoin
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '55555555-5555-4555-8555-555555555555',
  'Assignment: Whitepaper Sentence Decode',
  'Practice translating technical language into everyday terms. Rewrite this sentence in plain language: "A purely peer-to-peer version of electronic cash…"',
  5, 'the-birth-of-bitcoin',
  'Rewrite this sentence in plain language: "A purely peer-to-peer version of electronic cash…"',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 6: Keys & Transactions
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '66666666-6666-4666-8666-666666666666',
  'Assignment: First Wallet Proof',
  'Hands-on practice with wallet creation, backup, and recovery. Create a wallet, back up seed securely, restore it (dry run). Reflection: What went wrong or surprised you?',
  6, 'keys-and-transactions',
  'Create a wallet, back up seed securely, restore it (dry run). Reflection: What went wrong or surprised you?',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 200, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 7: Blockchain Basics
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '77777777-7777-4777-8777-777777777777',
  'Assignment: Understanding a Block',
  'Explain the consequences of attempting to alter a transaction in a previous block on the blockchain. What would happen if someone tried to change a transaction in an old block?',
  7, 'blockchain-basics',
  'What would happen if someone tried to change a transaction in an old block?',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 8: Software Wallet & Exchange
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '88888888-8888-4888-8888-888888888888',
  'Assignment: Create & Validate Bitcoin Addresses',
  'Part A: Create one on-chain receive address and one Lightning receive request. Part B: Validate addresses by pasting correct and incorrect addresses in each field.',
  8, 'exchange-software-wallet',
  'Part A: Create addresses. Part B: Validate addresses with correct and incorrect examples.',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 10: Good Bitcoin Hygiene
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '10101010-1010-4101-8101-010101010101',
  'Assignment: Protect Your Future Self',
  'Reflect on why using a new receive address every time is important for privacy and security.',
  10, 'good-bitcoin-hygiene',
  'Why should you use a new receive address every time?',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 9: UTXOs, Fees & Coin Control
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  '99999999-9999-4999-8999-999999999999',
  'Assignment: Choose the Correct UTXOs',
  'Interactive exercise where students select the optimal UTXOs to spend for a given payment amount, learning about fee efficiency and change outputs.',
  9, 'utxos-fees-coin-control',
  'You have UTXOs: A (0.010 BTC), B (0.004 BTC), C (0.002 BTC). You want to send 0.006 BTC. Transaction fee: 0.0002 BTC per input. Which UTXOs should you use?',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  chapter_number = EXCLUDED.chapter_number,
  chapter_slug = EXCLUDED.chapter_slug,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 11: Hardware Signers
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  'Assignment: Threat Model',
  'Understand the security benefits of hardware wallets. List 3 threats a hardware wallet protects against.',
  11, 'hardware-signers',
  'List 3 threats a hardware wallet protects against.',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 18: Bitcoin Script
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Assignment: Script Recognition',
  'Identify the script type for each address: Address A (bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080) → P2WPKH, Address B (3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy) → P2SH, Address C (bc1p5cyxnuxmeuwuvkwfem96llyxf3s2h0c6h7) → Taproot (P2TR)',
  18, 'intro-to-bitcoin-script-optional-track',
  'Identify the script type for three addresses: Address A, Address B, Address C',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 200, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- Chapter 20: Philosophy
INSERT INTO assignments (
  id, title, description, chapter_number, chapter_slug, question, search_address,
  correct_answer, answer_type, points, reward_sats, status, cohort_id, created_at, updated_at
) VALUES (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Assignment: Code or State',
  'Reflect on your perspective of Bitcoin after completing the course. What do you think of Bitcoin?',
  20, 'why-bitcoin-philosophy-adoption',
  'What do you think of Bitcoin?',
  NULL, 'INSTRUCTOR_REVIEW', 'text', 10, 100, 'active', NULL, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  question = EXCLUDED.question,
  reward_sats = EXCLUDED.reward_sats,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION: Check that all assignments were created
-- ============================================================================
-- Run this query to verify:
-- SELECT id, title, chapter_number, reward_sats, status FROM assignments ORDER BY chapter_number;
-- ============================================================================

