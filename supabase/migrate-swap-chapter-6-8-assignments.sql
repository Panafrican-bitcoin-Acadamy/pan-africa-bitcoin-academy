-- ============================================================================
-- MIGRATION: Swap Chapter 6 and Chapter 8 Assignments
-- ============================================================================
-- This script updates existing database records to swap the assignments:
-- - Chapter 6: "Create & Validate Bitcoin Addresses" → "First Wallet Proof"
-- - Chapter 8: "First Wallet Proof" → "Create & Validate Bitcoin Addresses"
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Update Chapter 6 assignment (UUID: 66666666-6666-4666-8666-666666666666)
-- Change from "Create & Validate Bitcoin Addresses" to "First Wallet Proof"
UPDATE assignments
SET
  title = 'Assignment: First Wallet Proof',
  description = 'Hands-on practice with wallet creation, backup, and recovery. Create a wallet, back up seed securely, restore it (dry run). Reflection: What went wrong or surprised you?',
  chapter_number = 6,
  chapter_slug = 'keys-and-transactions',
  question = 'Create a wallet, back up seed securely, restore it (dry run). Reflection: What went wrong or surprised you?',
  reward_sats = 200,
  updated_at = NOW()
WHERE id = '66666666-6666-4666-8666-666666666666';

-- Update Chapter 8 assignment (UUID: 88888888-8888-4888-8888-888888888888)
-- Change from "First Wallet Proof" to "Create & Validate Bitcoin Addresses"
UPDATE assignments
SET
  title = 'Assignment: Create & Validate Bitcoin Addresses',
  description = 'Part A: Create one on-chain receive address and one Lightning receive request. Part B: Validate addresses by pasting correct and incorrect addresses in each field.',
  chapter_number = 8,
  chapter_slug = 'exchange-software-wallet',
  question = 'Part A: Create addresses. Part B: Validate addresses with correct and incorrect examples.',
  reward_sats = 100,
  updated_at = NOW()
WHERE id = '88888888-8888-4888-8888-888888888888';

-- ============================================================================
-- VERIFICATION: Check that assignments were updated correctly
-- ============================================================================
-- Run this query to verify:
-- SELECT id, title, chapter_number, chapter_slug, reward_sats 
-- FROM assignments 
-- WHERE id IN ('66666666-6666-4666-8666-666666666666', '88888888-8888-4888-8888-888888888888')
-- ORDER BY chapter_number;
-- ============================================================================
-- Expected results:
-- - Chapter 6: "Assignment: First Wallet Proof", reward_sats = 200
-- - Chapter 8: "Assignment: Create & Validate Bitcoin Addresses", reward_sats = 100
-- ============================================================================

