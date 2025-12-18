-- Create sponsorships table to track student sponsorships
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sponsorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_name TEXT,
  sponsor_email TEXT,
  sponsor_anonymous BOOLEAN DEFAULT false, -- If true, don't show sponsor name publicly
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Optional: specific student being sponsored
  amount_sats INTEGER, -- Amount in sats (if provided)
  payment_method TEXT CHECK (payment_method IN ('lightning', 'onchain', 'other')),
  payment_tx_id TEXT, -- Transaction ID or payment reference
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  message TEXT, -- Optional message from sponsor
  is_general_sponsorship BOOLEAN DEFAULT false, -- If true, not tied to specific student
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sponsorships_student ON sponsorships(student_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_created ON sponsorships(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor_email ON sponsorships(sponsor_email);

-- Enable Row Level Security
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to SELECT confirmed sponsorships (for display on website)
CREATE POLICY "Allow public to view confirmed sponsorships" ON sponsorships
  FOR SELECT
  USING (status = 'confirmed' AND sponsor_anonymous = false);

-- Policy: Block all INSERT operations from client (only service role can insert)
CREATE POLICY "Block client inserts" ON sponsorships
  FOR INSERT
  WITH CHECK (false);

-- Policy: Block all UPDATE operations from client (only service role can update)
CREATE POLICY "Block client updates" ON sponsorships
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Policy: Block all DELETE operations from client (only service role can delete)
CREATE POLICY "Block client deletes" ON sponsorships
  FOR DELETE
  USING (false);

-- Add comments
COMMENT ON TABLE sponsorships IS 'Tracks student sponsorships and donations';
COMMENT ON COLUMN sponsorships.student_id IS 'Optional: specific student being sponsored. If NULL, general sponsorship';
COMMENT ON COLUMN sponsorships.is_general_sponsorship IS 'If true, sponsorship is for general academy support, not a specific student';
COMMENT ON COLUMN sponsorships.sponsor_anonymous IS 'If true, sponsor name will not be displayed publicly';
