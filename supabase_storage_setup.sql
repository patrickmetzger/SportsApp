-- Supabase Storage Policies for program-images bucket

-- IMPORTANT: Before running this SQL, create the bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create bucket"
-- 3. Name: program-images
-- 4. Set to PUBLIC (check the "Public bucket" option)
-- 5. File size limit: 5MB (5242880 bytes)

-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
  USING (bucket_id = 'program-images');

-- Allow authenticated admins to upload
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'program-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated admins to update
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'program-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated admins to delete
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'program-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
