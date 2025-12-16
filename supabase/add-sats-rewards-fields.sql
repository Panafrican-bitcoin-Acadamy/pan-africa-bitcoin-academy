-- Add Enhanced Fields to sats_rewards Table
-- This migration adds Option 1 (minimal tracking) and Option 3 (related entities)
-- Run this after the base schema.sql

-- ============================================
-- Option 1: MINIMAL ADDITIONS
-- ============================================

-- Add status field to track payment state
ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'processing', 'paid', 'failed'));

-- Add payment_date to track when sats were actually paid
ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Add awarded_by to track which admin/mentor awarded the sats (audit trail)
ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS awarded_by UUID REFERENCES profiles(id);

-- Add reward_type to categorize rewards
ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS reward_type TEXT 
CHECK (reward_type IN ('assignment', 'chapter', 'discussion', 'peer_help', 'project', 'attendance', 'other'));

-- ============================================
-- Option 3: LINK TO RELATED ENTITIES
-- ============================================

-- Add related_entity_type to specify what type of entity this reward is for
ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS related_entity_type TEXT 
CHECK (related_entity_type IN ('assignment', 'chapter', 'event', 'discussion', 'project', 'other'));

-- Add related_entity_id to link to the specific entity (assignment ID, chapter number, event ID, etc.)
ALTER TABLE sats_rewards
ADD COLUMN IF NOT EXISTS related_entity_id UUID;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for querying by student and status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_sats_rewards_student_status 
ON sats_rewards(student_id, status);

-- Index for querying by reward type
CREATE INDEX IF NOT EXISTS idx_sats_rewards_type 
ON sats_rewards(reward_type);

-- Index for querying by creation date (for recent rewards)
CREATE INDEX IF NOT EXISTS idx_sats_rewards_created 
ON sats_rewards(created_at DESC);

-- Index for querying by related entity (for finding rewards for specific assignments/chapters)
CREATE INDEX IF NOT EXISTS idx_sats_rewards_related_entity 
ON sats_rewards(related_entity_type, related_entity_id);

-- Index for querying by awarded_by (for admin audit trails)
CREATE INDEX IF NOT EXISTS idx_sats_rewards_awarded_by 
ON sats_rewards(awarded_by);

-- ============================================
-- UPDATE EXISTING RECORDS (if any)
-- ============================================

-- Set default status for existing records
UPDATE sats_rewards 
SET status = CASE 
  WHEN amount_paid > 0 THEN 'paid'
  WHEN amount_pending > 0 THEN 'pending'
  ELSE 'pending'
END
WHERE status IS NULL;

-- Set payment_date for existing paid records
UPDATE sats_rewards 
SET payment_date = updated_at
WHERE amount_paid > 0 AND payment_date IS NULL;

-- Set default reward_type for existing records
UPDATE sats_rewards 
SET reward_type = 'other'
WHERE reward_type IS NULL;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN sats_rewards.status IS 'Payment state: pending, processing, paid, or failed';
COMMENT ON COLUMN sats_rewards.payment_date IS 'Timestamp when sats were actually paid out';
COMMENT ON COLUMN sats_rewards.awarded_by IS 'Profile ID of admin/mentor who awarded these sats';
COMMENT ON COLUMN sats_rewards.reward_type IS 'Category of reward: assignment, chapter, discussion, peer_help, project, attendance, or other';
COMMENT ON COLUMN sats_rewards.related_entity_type IS 'Type of entity this reward is linked to: assignment, chapter, event, discussion, project, or other';
COMMENT ON COLUMN sats_rewards.related_entity_id IS 'UUID of the related entity (assignment ID, event ID, etc.)';
