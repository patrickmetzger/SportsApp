-- Migration 13: Add School Branding (Logo and Colors)

-- Add website, logo_url and color columns to schools table
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1e40af',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#3b82f6';

-- Add comments for documentation
COMMENT ON COLUMN schools.website IS 'School website URL';
COMMENT ON COLUMN schools.logo_url IS 'URL to school logo image';
COMMENT ON COLUMN schools.primary_color IS 'Primary brand color (hex format)';
COMMENT ON COLUMN schools.secondary_color IS 'Secondary brand color (hex format)';

-- Update RLS policy for school admins to update their own school
DROP POLICY IF EXISTS "School admins can update their school" ON schools;
CREATE POLICY "School admins can update their school" ON schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'school_admin'
      AND users.school_id = schools.id
    )
  );
