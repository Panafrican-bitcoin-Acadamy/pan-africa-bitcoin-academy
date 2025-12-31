-- ============================================================================
-- MIGRATION: Reorder Chapters 12-15
-- ============================================================================
-- This script updates database records to reflect the new chapter order:
-- OLD ORDER:
--   Chapter 12: Layer 2 & Sidechains (slug: layer-2-sidechains-in-daily-life)
--   Chapter 13: Verify — Block Explorers & Nodes (slug: verify-for-yourself-block-explorers-nodes)
--   Chapter 14: Proof of Work and Block Rewards (slug: proof-of-work-and-block-rewards)
--   Chapter 15: Mining in Practice (slug: mining-in-practice)
--
-- NEW ORDER:
--   Chapter 12: Verify — Block Explorers & Nodes (slug: verify-for-yourself-block-explorers-nodes)
--   Chapter 13: Proof of Work and Block Rewards (slug: proof-of-work-and-block-rewards)
--   Chapter 14: Mining in Practice (slug: mining-in-practice)
--   Chapter 15: Layer 2 & Sidechains (slug: layer-2-sidechains-in-daily-life)
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- Update chapter_progress table
-- Chapter 12 (old Layer 2) → Chapter 15 (new Layer 2)
UPDATE chapter_progress
SET chapter_number = 15,
    chapter_slug = 'layer-2-sidechains-in-daily-life',
    updated_at = NOW()
WHERE chapter_number = 12 AND chapter_slug = 'layer-2-sidechains-in-daily-life';

-- Chapter 13 (old Verify) → Chapter 12 (new Verify)
UPDATE chapter_progress
SET chapter_number = 12,
    chapter_slug = 'verify-for-yourself-block-explorers-nodes',
    updated_at = NOW()
WHERE chapter_number = 13 AND chapter_slug = 'verify-for-yourself-block-explorers-nodes';

-- Chapter 14 (old Proof of Work) → Chapter 13 (new Proof of Work)
UPDATE chapter_progress
SET chapter_number = 13,
    chapter_slug = 'proof-of-work-and-block-rewards',
    updated_at = NOW()
WHERE chapter_number = 14 AND chapter_slug = 'proof-of-work-and-block-rewards';

-- Chapter 15 (old Mining) → Chapter 14 (new Mining)
UPDATE chapter_progress
SET chapter_number = 14,
    chapter_slug = 'mining-in-practice',
    updated_at = NOW()
WHERE chapter_number = 15 AND chapter_slug = 'mining-in-practice';

-- Update assignments table
-- Explorer Scavenger Hunt assignment - update to Chapter 12 (was 13)
UPDATE assignments
SET chapter_number = 12,
    chapter_slug = 'verify-for-yourself-block-explorers-nodes',
    updated_at = NOW()
WHERE title = 'Explorer Scavenger Hunt' OR (chapter_number = 13 AND chapter_slug = 'verify-for-yourself-block-explorers-nodes');

-- If there are any assignments for the old Chapter 12 (Layer 2), update them to Chapter 15
UPDATE assignments
SET chapter_number = 15,
    chapter_slug = 'layer-2-sidechains-in-daily-life',
    updated_at = NOW()
WHERE chapter_number = 12 AND chapter_slug = 'layer-2-sidechains-in-daily-life';

-- If there are any assignments for Chapter 14 (Proof of Work), update to Chapter 13
UPDATE assignments
SET chapter_number = 13,
    chapter_slug = 'proof-of-work-and-block-rewards',
    updated_at = NOW()
WHERE chapter_number = 14 AND chapter_slug = 'proof-of-work-and-block-rewards';

-- If there are any assignments for Chapter 15 (Mining), update to Chapter 14
UPDATE assignments
SET chapter_number = 14,
    chapter_slug = 'mining-in-practice',
    updated_at = NOW()
WHERE chapter_number = 15 AND chapter_slug = 'mining-in-practice';

-- ============================================================================
-- VERIFICATION: Check that updates were applied correctly
-- ============================================================================
-- Run these queries to verify:
--
-- Check chapter_progress:
-- SELECT chapter_number, chapter_slug, COUNT(*) as count
-- FROM chapter_progress
-- WHERE chapter_number IN (12, 13, 14, 15)
-- GROUP BY chapter_number, chapter_slug
-- ORDER BY chapter_number;
--
-- Check assignments:
-- SELECT id, title, chapter_number, chapter_slug
-- FROM assignments
-- WHERE chapter_number IN (12, 13, 14, 15)
-- ORDER BY chapter_number;
-- ============================================================================
-- Expected results:
-- Chapter 12: verify-for-yourself-block-explorers-nodes
-- Chapter 13: proof-of-work-and-block-rewards
-- Chapter 14: mining-in-practice
-- Chapter 15: layer-2-sidechains-in-daily-life
-- ============================================================================

