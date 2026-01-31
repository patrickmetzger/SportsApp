-- Supabase Storage Policies for coach-certifications bucket

-- IMPORTANT: Before running this SQL, create the bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create bucket"
-- 3. Name: coach-certifications
-- 4. Set to PRIVATE (uncheck the "Public bucket" option - certs should not be public)
-- 5. File size limit: 10MB (10485760 bytes)
-- 6. Allowed MIME types: image/jpeg, image/png, image/heic, application/pdf

-- Folder structure: {coach_id}/{timestamp}-{filename}

-- Allow coaches to upload their own certifications
CREATE POLICY "Coaches can upload their certifications" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'coach-certifications' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Allow coaches to view their own certifications
CREATE POLICY "Coaches can view their certifications" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'coach-certifications' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow coaches to update their own certifications
CREATE POLICY "Coaches can update their certifications" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'coach-certifications' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Allow coaches to delete their own certifications
CREATE POLICY "Coaches can delete their certifications" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'coach-certifications' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Allow admins to view all certifications
CREATE POLICY "Admins can view all certifications" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'coach-certifications' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to manage all certifications
CREATE POLICY "Admins can manage all certifications" ON storage.objects FOR ALL
  USING (
    bucket_id = 'coach-certifications' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow school admins to view certifications for coaches in their school
CREATE POLICY "School admins can view their school certifications" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'coach-certifications' AND
    EXISTS (
      SELECT 1 FROM users admin_user
      JOIN users coach_user ON coach_user.id::text = (storage.foldername(name))[1]
      WHERE admin_user.id = auth.uid()
        AND admin_user.role = 'school_admin'
        AND admin_user.school_id = coach_user.school_id
    )
  );
