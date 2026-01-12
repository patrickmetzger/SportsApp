-- Migration 15: Allow coaches to edit programs they created or are assigned to

-- Add created_by column to track program creator
ALTER TABLE summer_programs
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_summer_programs_created_by ON summer_programs(created_by);

-- RLS Policy: Coaches can view programs they're assigned to or created
CREATE POLICY "Coaches can view their assigned programs" ON summer_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_coaches
      WHERE program_coaches.coach_id = auth.uid()
        AND program_coaches.program_id = summer_programs.id
    )
    OR created_by = auth.uid()
  );

-- RLS Policy: Coaches can update programs they're assigned to or created
CREATE POLICY "Coaches can update their assigned programs" ON summer_programs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM program_coaches
      WHERE program_coaches.coach_id = auth.uid()
        AND program_coaches.program_id = summer_programs.id
    )
    OR created_by = auth.uid()
  );

-- RLS Policy: Coaches can create programs (they'll be auto-assigned as created_by)
CREATE POLICY "Coaches can create programs" ON summer_programs
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'coach'
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN summer_programs.created_by IS 'The user (coach/admin) who created this program';
