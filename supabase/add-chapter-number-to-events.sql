-- Add chapter_number column to events table
-- This links live-class events to specific chapters

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS chapter_number INTEGER;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_chapter_number ON events(chapter_number);

-- Add comment
COMMENT ON COLUMN events.chapter_number IS 'Chapter number this live-class event is for (only relevant when type = live-class)';








