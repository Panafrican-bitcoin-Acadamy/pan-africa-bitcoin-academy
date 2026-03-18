-- Add status and duration_minutes to events for tracking "Done" and time spent.
-- Run this migration in Supabase SQL editor or via supabase db push if you use Supabase CLI.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed')),
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

COMMENT ON COLUMN events.status IS 'scheduled | completed - set when admin marks event as Done';
COMMENT ON COLUMN events.duration_minutes IS 'Actual duration in minutes when event is marked done (for impact metrics)';
