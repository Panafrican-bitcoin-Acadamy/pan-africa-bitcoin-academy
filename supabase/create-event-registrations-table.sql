-- Create event registrations table
-- This table stores registrations for non-cohort events only
-- Cohort-based events do not use this registration system

-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  additional_data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate registrations per event (same email)
  UNIQUE(event_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON event_registrations(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role (API) can insert/read registrations
-- Clients cannot directly access this table
CREATE POLICY "API only - no direct client access - event_registrations"
ON event_registrations
FOR ALL
USING (false)
WITH CHECK (false);

-- Add comments
COMMENT ON TABLE event_registrations IS 'Stores registrations for non-cohort events only. Linked to events table via event_id. Cohort-based events do not use this table.';
COMMENT ON COLUMN event_registrations.event_id IS 'References events.id. Only non-cohort events (cohort_id IS NULL) should have registrations.';
COMMENT ON COLUMN event_registrations.additional_data IS 'JSON object storing custom form field values when form_config is used. Example: {"company": "Acme Corp", "experience_level": "Advanced"}.';

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

