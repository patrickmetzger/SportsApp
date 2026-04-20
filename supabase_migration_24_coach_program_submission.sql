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
