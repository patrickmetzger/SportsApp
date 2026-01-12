-- Migration 12: School Admin Dashboard Enhancements
-- This migration adds school association to programs and enhances school admin permissions

-- 1. Add school_id to summer_programs table
ALTER TABLE summer_programs
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_summer_programs_school_id ON summer_programs(school_id);

COMMENT ON COLUMN summer_programs.school_id IS 'School that owns this program';

-- 2. Backfill existing programs with school from their coaches
-- This uses the program_coaches relationship to infer the school
UPDATE summer_programs sp
SET school_id = (
  SELECT DISTINCT u.school_id
  FROM program_coaches pc
  JOIN users u ON u.id = pc.coach_id
  WHERE pc.program_id = sp.id
  AND u.school_id IS NOT NULL
  LIMIT 1
)
WHERE sp.school_id IS NULL;

-- 3. Update RLS policies for school admins to manage programs
DROP POLICY IF EXISTS "School admins can manage their school programs" ON summer_programs;

CREATE POLICY "School admins can view their school programs" ON summer_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = summer_programs.school_id
    )
  );

CREATE POLICY "School admins can create programs for their school" ON summer_programs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = summer_programs.school_id
    )
  );

CREATE POLICY "School admins can update their school programs" ON summer_programs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = summer_programs.school_id
    )
  );

CREATE POLICY "School admins can delete their school programs" ON summer_programs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = summer_programs.school_id
    )
  );

-- 4. Add RLS policies for school admins to manage parents
CREATE POLICY "School admins can view parents at their school" ON users
  FOR SELECT USING (
    role = 'parent' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = users.school_id
    )
  );

CREATE POLICY "School admins can create parents for their school" ON users
  FOR INSERT WITH CHECK (
    role = 'parent' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = school_id
    )
  );

CREATE POLICY "School admins can update parents at their school" ON users
  FOR UPDATE USING (
    role = 'parent' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = users.school_id
    )
  );

-- 5. Add RLS policies for school admins to manage other school admins at their school
CREATE POLICY "School admins can view other school admins at their school" ON users
  FOR SELECT USING (
    role = 'school_admin' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = users.school_id
    )
  );

CREATE POLICY "School admins can create school admins for their school" ON users
  FOR INSERT WITH CHECK (
    role = 'school_admin' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = school_id
    )
  );

CREATE POLICY "School admins can update school admins at their school" ON users
  FOR UPDATE USING (
    role = 'school_admin' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = users.school_id
    )
  );

-- 6. Update comment for users.school_id to reflect new usage
COMMENT ON COLUMN users.school_id IS 'School association: required for coaches/school_admins, optional for parents';

-- 7. Update comment for communications.recipient_type to include parents
COMMENT ON COLUMN communications.recipient_type IS 'Type of recipients: individual, school_coaches, school_parents, all_coaches, all_parents';
