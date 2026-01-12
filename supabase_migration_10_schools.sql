-- Migration 10: Add Schools and Associate Coaches with Schools

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  principal_name TEXT,
  athletic_director_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add school_id to users table for coaches
ALTER TABLE users
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON TABLE schools IS 'Schools in the athletic system';
COMMENT ON COLUMN schools.name IS 'School name';
COMMENT ON COLUMN schools.address IS 'Street address';
COMMENT ON COLUMN schools.city IS 'City';
COMMENT ON COLUMN schools.state IS 'State';
COMMENT ON COLUMN schools.zip_code IS 'ZIP code';
COMMENT ON COLUMN schools.phone IS 'School phone number';
COMMENT ON COLUMN schools.email IS 'School contact email';
COMMENT ON COLUMN schools.principal_name IS 'Name of school principal';
COMMENT ON COLUMN schools.athletic_director_name IS 'Name of athletic director';
COMMENT ON COLUMN schools.notes IS 'Additional notes about the school';
COMMENT ON COLUMN users.school_id IS 'School the coach belongs to (for coaches only)';

-- Enable RLS on schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Anyone can view schools
CREATE POLICY "Anyone can view schools" ON schools
  FOR SELECT USING (true);

-- Only admins can modify schools
CREATE POLICY "Admins can manage schools" ON schools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample schools (optional - adjust as needed)
INSERT INTO schools (name, city, state) VALUES
  ('Lincoln High School', 'Springfield', 'IL'),
  ('Washington Middle School', 'Madison', 'WI'),
  ('Jefferson Elementary', 'Austin', 'TX')
ON CONFLICT DO NOTHING;
