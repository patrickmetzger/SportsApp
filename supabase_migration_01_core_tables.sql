-- Migration 1: Core Tables for Summer Programs Feature

-- Summer Programs table
CREATE TABLE IF NOT EXISTS summer_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE NOT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  header_image_url TEXT,
  program_image_url TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program Coaches (many-to-many relationship)
CREATE TABLE IF NOT EXISTS program_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES summer_programs(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'assistant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, coach_id)
);

-- Program Registrations
CREATE TABLE IF NOT EXISTS program_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES summer_programs(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE summer_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for public read access to programs
CREATE POLICY "Anyone can view programs" ON summer_programs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view program coaches" ON program_coaches
  FOR SELECT USING (true);

-- Admins can manage everything
CREATE POLICY "Admins can manage programs" ON summer_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage program coaches" ON program_coaches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all registrations" ON program_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can create registrations" ON program_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update registrations" ON program_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_program_coaches_program_id ON program_coaches(program_id);
CREATE INDEX idx_program_coaches_coach_id ON program_coaches(coach_id);
CREATE INDEX idx_registrations_program_id ON program_registrations(program_id);
CREATE INDEX idx_registrations_status ON program_registrations(status);
CREATE INDEX idx_registrations_student_id ON program_registrations(student_id);
