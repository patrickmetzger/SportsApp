-- Migration 2: Mock Students for Validation

-- Mock students for validation (not linked to auth)
CREATE TABLE IF NOT EXISTS mock_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mock_students ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for validation)
CREATE POLICY "Anyone can view mock students" ON mock_students
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage mock students" ON mock_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
