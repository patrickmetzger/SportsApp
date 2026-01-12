-- Migration 11: Add School Admin Role and Communications System

-- Add phone number to users table if not exists
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN users.phone IS 'User phone number for SMS communications';

-- Create communications table for tracking messages
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_ids UUID[] NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('individual', 'school_coaches', 'all_coaches')),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE communications IS 'Communication history between admins/school_admins and coaches';
COMMENT ON COLUMN communications.sender_id IS 'User who sent the communication';
COMMENT ON COLUMN communications.recipient_ids IS 'Array of user IDs who received the message';
COMMENT ON COLUMN communications.recipient_type IS 'Type of recipients: individual, school_coaches, or all_coaches';
COMMENT ON COLUMN communications.school_id IS 'School context for the communication';
COMMENT ON COLUMN communications.subject IS 'Subject line of the message';
COMMENT ON COLUMN communications.message IS 'Message content';
COMMENT ON COLUMN communications.delivery_method IS 'How the message was delivered: email, sms, or both';
COMMENT ON COLUMN communications.status IS 'Delivery status of the message';

-- Enable RLS on communications
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Admins can view all communications
CREATE POLICY "Admins can view all communications" ON communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- School admins can view their school's communications
CREATE POLICY "School admins can view their school communications" ON communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = communications.school_id
    )
  );

-- Admins and school admins can create communications
CREATE POLICY "Admins and school admins can create communications" ON communications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'school_admin')
    )
  );

-- Update trigger for communications
CREATE TRIGGER update_communications_updated_at
    BEFORE UPDATE ON communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies for schools table to allow school_admins
DROP POLICY IF EXISTS "Admins can manage schools" ON schools;

CREATE POLICY "Admins can manage schools" ON schools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "School admins can view their school" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = schools.id
    )
  );

CREATE POLICY "School admins can update their school" ON schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      AND school_id = schools.id
    )
  );

-- Update RLS policies for summer_programs to allow school_admins
CREATE POLICY "School admins can manage their school programs" ON summer_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'school_admin'
      -- School admins can manage programs where coaches from their school are assigned
    )
  );

-- Update RLS policies for users table to allow school_admins to manage their coaches
CREATE POLICY "School admins can view coaches at their school" ON users
  FOR SELECT USING (
    role = 'coach' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = users.school_id
    )
  );

CREATE POLICY "School admins can update coaches at their school" ON users
  FOR UPDATE USING (
    role = 'coach' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = users.school_id
    )
  );

CREATE POLICY "School admins can create coaches for their school" ON users
  FOR INSERT WITH CHECK (
    role = 'coach' AND EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'school_admin'
      AND u.school_id = school_id
    )
  );
