-- Add image_alt_text column to events table
-- This allows events to have accessible alt text for images

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_alt_text TEXT;

COMMENT ON COLUMN events.image_alt_text IS 'Alt text for the event image. Used for accessibility (screen readers).';

