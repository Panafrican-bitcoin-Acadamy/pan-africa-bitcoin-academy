-- Add image_url column to events table
-- This allows events to have associated images that will be displayed in the "Upcoming Events" section

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.image_url IS 'URL of the event image. Images are stored in Supabase Storage and displayed in the upcoming events section.';

