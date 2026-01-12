-- Migration 14: Program Attendance System

-- Program Attendance table
CREATE TABLE IF NOT EXISTS program_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES summer_programs(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id TEXT, -- External student ID from school system
  parent_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to parent if registered
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id), -- The coach who recorded it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, student_name, attendance_date) -- Prevent duplicate records
);

-- Create indexes for performance
CREATE INDEX idx_attendance_program_id ON program_attendance(program_id);
CREATE INDEX idx_attendance_date ON program_attendance(attendance_date);
CREATE INDEX idx_attendance_recorded_by ON program_attendance(recorded_by);
CREATE INDEX idx_attendance_parent_user_id ON program_attendance(parent_user_id);

-- Enable Row Level Security
ALTER TABLE program_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Attendance

-- Admins can manage all attendance
CREATE POLICY "Admins can manage all attendance" ON program_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- School admins can manage attendance for their school's programs
CREATE POLICY "School admins can manage attendance for their school" ON program_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN summer_programs sp ON sp.school_id = u.school_id
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND sp.id = program_attendance.program_id
    )
  );

-- Coaches can manage attendance for programs they're assigned to
CREATE POLICY "Coaches can view attendance for their programs" ON program_attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_coaches
      WHERE program_coaches.coach_id = auth.uid()
        AND program_coaches.program_id = program_attendance.program_id
    )
  );

CREATE POLICY "Coaches can insert attendance for their programs" ON program_attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_coaches
      WHERE program_coaches.coach_id = auth.uid()
        AND program_coaches.program_id = program_attendance.program_id
    )
    AND recorded_by = auth.uid()
  );

CREATE POLICY "Coaches can update attendance for their programs" ON program_attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM program_coaches
      WHERE program_coaches.coach_id = auth.uid()
        AND program_coaches.program_id = program_attendance.program_id
    )
  );

-- Parents can view attendance for their children
CREATE POLICY "Parents can view their children's attendance" ON program_attendance
  FOR SELECT USING (
    parent_user_id = auth.uid()
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_attendance_timestamp
  BEFORE UPDATE ON program_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_updated_at();

-- Add comments for documentation
COMMENT ON TABLE program_attendance IS 'Daily attendance records for students in summer programs';
COMMENT ON COLUMN program_attendance.status IS 'Attendance status: present, absent, excused, or late';
COMMENT ON COLUMN program_attendance.student_id IS 'External student ID from school system for integration';
COMMENT ON COLUMN program_attendance.parent_user_id IS 'Link to parent user account if student was registered through the platform';
