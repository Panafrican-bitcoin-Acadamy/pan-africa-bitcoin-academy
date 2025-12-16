-- Sats Rewards Table Improvements
-- This file suggests additional fields that could be useful for the sats_rewards system

-- Current structure:
-- - id (UUID)
-- - student_id (UUID) - References profiles(id)
-- - amount_paid (INTEGER) - Amount in sats that has been paid
-- - amount_pending (INTEGER) - Amount in sats pending payment
-- - reason (TEXT) - Reason for the reward
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- ============================================
-- RECOMMENDED ADDITIONS:
-- ============================================

-- Option 1: MINIMAL ADDITIONS (Recommended for MVP)
-- Add these fields for better tracking:

ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS awarded_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reward_type TEXT CHECK (reward_type IN ('assignment', 'chapter', 'discussion', 'peer_help', 'project', 'attendance', 'other'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sats_rewards_student_status ON sats_rewards(student_id, status);
CREATE INDEX IF NOT EXISTS idx_sats_rewards_type ON sats_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_sats_rewards_created ON sats_rewards(created_at DESC);

-- ============================================
-- Option 2: FULL FEATURES (For future Lightning integration)
-- ============================================

-- If you want to track Lightning Network payments:
-- ALTER TABLE sats_rewards
-- ADD COLUMN IF NOT EXISTS lightning_invoice TEXT,
-- ADD COLUMN IF NOT EXISTS lightning_preimage TEXT,
-- ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'lightning' CHECK (payment_method IN ('lightning', 'onchain', 'manual')),
-- ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- ============================================
-- Option 3: LINK TO RELATED ENTITIES (For better tracking)
-- ============================================

-- If you want to link rewards to specific assignments/chapters/events:
-- ALTER TABLE sats_rewards
-- ADD COLUMN IF NOT EXISTS related_entity_type TEXT CHECK (related_entity_type IN ('assignment', 'chapter', 'event', 'discussion', 'project')),
-- ADD COLUMN IF NOT EXISTS related_entity_id UUID;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Current design uses amount_paid + amount_pending in same record
--    This allows one record to track both states
--    Alternative: Use status field and move amount_pending to amount_paid when paid
--
-- 2. Consider if you want:
--    - One record per reward (simpler, cleaner)
--    - Or keep current design (allows partial payments)
--
-- 3. For MVP, Option 1 (minimal) is recommended:
--    - status: Track payment state
--    - payment_date: When actually paid
--    - awarded_by: Audit trail
--    - reward_type: Categorize rewards
