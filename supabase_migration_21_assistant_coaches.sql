-- Migration 21: Assistant Coaches
-- Adds assistant_coach role support and coach_assistants relationship table

-- Table linking assistant coaches to coaches (many-to-many)
CREATE TABLE IF NOT EXISTS coach_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(coach_id, assistant_id)
);

-- Indexes for performance
CREATE INDEX idx_coach_assistants_coach ON coach_assistants(coach_id);
CREATE INDEX idx_coach_assistants_assistant ON coach_assistants(assistant_id);

-- Enable Row Level Security
ALTER TABLE coach_assistants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_assistants table

-- Admins can manage all coach assistant relationships
CREATE POLICY "Admins can manage coach assistants" ON coach_assistants
  FOR ALL USING (is_admin());

-- School admins can manage coach assistants for their school
CREATE POLICY "School admins can manage their school coach assistants" ON coach_assistants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u1, users u2
      WHERE u1.id = auth.uid()
        AND u1.role = 'school_admin'
        AND u2.id = coach_assistants.coach_id
        AND u1.school_id = u2.school_id
    )
  );

-- Coaches can manage their own assistants
CREATE POLICY "Coaches can manage their assistants" ON coach_assistants
  FOR ALL USING (coach_id = auth.uid());

-- Assistant coaches can view their own assignments
CREATE POLICY "Assistants can view their assignments" ON coach_assistants
  FOR SELECT USING (assistant_id = auth.uid());

-- RLS Policies for summer_programs table (assistant coach access)

-- Assistant coaches can view programs via their assigned coaches
CREATE POLICY "Assistant coaches can view programs" ON summer_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_assistants ca
      JOIN program_coaches pc ON pc.coach_id = ca.coach_id
      WHERE ca.assistant_id = auth.uid()
        AND pc.program_id = summer_programs.id
    )
  );

-- RLS Policies for program_attendance table (assistant coach access)

-- Assistant coaches can view attendance for their coaches' programs
CREATE POLICY "Assistant coaches can view attendance" ON program_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_assistants ca
      JOIN program_coaches pc ON pc.coach_id = ca.coach_id
      WHERE ca.assistant_id = auth.uid()
        AND pc.program_id = program_attendance.program_id
    )
  );

-- Assistant coaches can insert attendance for their coaches' programs
CREATE POLICY "Assistant coaches can insert attendance" ON program_attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_assistants ca
      JOIN program_coaches pc ON pc.coach_id = ca.coach_id
      WHERE ca.assistant_id = auth.uid()
        AND pc.program_id = program_attendance.program_id
    )
    AND recorded_by = auth.uid()
  );

-- Assistant coaches can update attendance they recorded
CREATE POLICY "Assistant coaches can update their attendance" ON program_attendance
  FOR UPDATE USING (
    recorded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coach_assistants ca
      JOIN program_coaches pc ON pc.coach_id = ca.coach_id
      WHERE ca.assistant_id = auth.uid()
        AND pc.program_id = program_attendance.program_id
    )
  );

-- RLS Policies for program_registrations (assistant coach can view)
CREATE POLICY "Assistant coaches can view registrations" ON program_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_assistants ca
      JOIN program_coaches pc ON pc.coach_id = ca.coach_id
      WHERE ca.assistant_id = auth.uid()
        AND pc.program_id = program_registrations.program_id
    )
  );
