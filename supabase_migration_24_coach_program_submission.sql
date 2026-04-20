-- supabase_migration_24_coach_program_submission.sql

-- Add status, submitted_by, and rejection_reason to summer_programs
ALTER TABLE summer_programs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update public visibility: only approved programs are publicly visible
-- (existing programs default to 'approved', so nothing breaks)
DROP POLICY IF EXISTS "Anyone can view programs" ON summer_programs;
CREATE POLICY "Anyone can view programs" ON summer_programs
  FOR SELECT USING (status = 'approved');

-- Coaches can view programs they submitted (any status)
CREATE POLICY "Coaches can view their submitted programs" ON summer_programs
  FOR SELECT USING (submitted_by = auth.uid());

-- Drop old coach INSERT policy from migration 15 (had no status check, allowing status bypass)
DROP POLICY IF EXISTS "Coaches can create programs" ON summer_programs;

-- Coaches can submit programs for their own school
CREATE POLICY "Coaches can submit programs" ON summer_programs
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'coach'
      AND u.school_id = summer_programs.school_id
    )
  );

-- Coaches can update their own pending or rejected programs (resubmission resets to pending)
CREATE POLICY "Coaches can resubmit their programs" ON summer_programs
  FOR UPDATE USING (
    submitted_by = auth.uid()
    AND status IN ('pending', 'rejected')
  ) WITH CHECK (
    status = 'pending'
    AND submitted_by = auth.uid()
  );

-- Update migration-15 assigned-programs SELECT policy to only show approved programs to assigned coaches
-- (Coaches can still see their own submitted programs via the policy above, regardless of status)
DROP POLICY IF EXISTS "Coaches can view their assigned programs" ON summer_programs;
CREATE POLICY "Coaches can view their assigned programs" ON summer_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_coaches
      WHERE program_coaches.coach_id = auth.uid()
        AND program_coaches.program_id = summer_programs.id
    )
    AND status = 'approved'
  );
