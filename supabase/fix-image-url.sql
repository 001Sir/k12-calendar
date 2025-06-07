-- Add image_url column to events table if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload event images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Create storage policy to allow public to view event images
CREATE POLICY "Allow public to view event images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'event-images');

-- Create storage policy to allow users to update their own event images
CREATE POLICY "Allow users to update their own event images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'event-images');

-- Create storage policy to allow users to delete their own event images
CREATE POLICY "Allow users to delete their own event images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'image_url';