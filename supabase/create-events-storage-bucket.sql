-- Create a dedicated storage bucket for event images
-- Run this in your Supabase SQL Editor

-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  true, -- Public bucket so images can be accessed directly
  NULL, -- No file size limit (unlimited)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = NULL; -- Update existing bucket to remove size limit

-- Set up storage policies for the events bucket
-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'events' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

-- Allow public read access to event images
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Allow admins to update event images
CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'events' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

-- Allow admins to delete event images
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'events' AND
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.email = (SELECT email FROM profiles WHERE id = auth.uid())
  )
);

