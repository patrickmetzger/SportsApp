-- Create the program-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-images', 'program-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to view images (public bucket)
CREATE POLICY "Public read access for program images"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload program images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update program images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete program images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'program-images'
  AND auth.role() = 'authenticated'
);
