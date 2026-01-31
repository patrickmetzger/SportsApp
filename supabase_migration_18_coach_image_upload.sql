-- Migration: Coach Image Upload Policies
-- This migration allows coaches to upload images to the program-images bucket

-- Allow coaches to upload to program-images bucket
CREATE POLICY "Coaches can upload program images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'program-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
);

-- Allow coaches to view program images
CREATE POLICY "Coaches can view program images" ON storage.objects
FOR SELECT USING (bucket_id = 'program-images');

-- Allow coaches to delete their uploaded images
CREATE POLICY "Coaches can delete program images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'program-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
);

-- Allow coaches to update their uploaded images
CREATE POLICY "Coaches can update program images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'program-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
);
