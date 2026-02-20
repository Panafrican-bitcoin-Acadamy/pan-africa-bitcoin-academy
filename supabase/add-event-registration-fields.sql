-- Add registration-related columns to events table
-- IMPORTANT: Registration is ONLY for non-cohort events (cohort_id IS NULL)
-- Cohort-based events are managed separately and do not use this registration system

-- Add registration-related columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_registration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_registrations INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add constraint: Registration can only be enabled for non-cohort events
-- This prevents enabling registration on cohort-based events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_registration_no_cohort'
  ) THEN
    ALTER TABLE events
    ADD CONSTRAINT check_registration_no_cohort 
    CHECK (
      (is_registration_enabled = false) OR 
      (is_registration_enabled = true AND cohort_id IS NULL)
    );
  END IF;
END $$;

-- Add index for registration-enabled events (only non-cohort events)
CREATE INDEX IF NOT EXISTS idx_events_registration_enabled ON events(is_registration_enabled, cohort_id) 
WHERE is_registration_enabled = true AND cohort_id IS NULL;

-- Add comments
COMMENT ON COLUMN events.is_registration_enabled IS 'Registration can only be enabled for non-cohort events (cohort_id must be NULL). Cohort-based events are managed separately.';
COMMENT ON COLUMN events.form_config IS 'JSON configuration for dynamic form fields. Only applicable for non-cohort events (cohort_id IS NULL). Example: {"fields": [{"name": "company", "type": "text", "required": true}, {"name": "experience_level", "type": "select", "options": ["Beginner", "Intermediate", "Advanced"]}]}';
COMMENT ON COLUMN events.location IS 'Event location. Only used for non-cohort events with registration enabled.';
COMMENT ON COLUMN events.event_date IS 'Event date. Only used for non-cohort events with registration enabled.';
COMMENT ON COLUMN events.max_registrations IS 'Maximum number of registrations allowed. Only applicable for non-cohort events.';
COMMENT ON COLUMN events.registration_deadline IS 'Deadline for event registration. Only applicable for non-cohort events.';

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'events' 
  AND column_name IN ('is_registration_enabled', 'location', 'event_date', 'form_config', 'max_registrations', 'registration_deadline')
ORDER BY column_name;

