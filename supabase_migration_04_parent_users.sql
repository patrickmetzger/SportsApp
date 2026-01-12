-- Migration 4: Add parent user linking to registrations

-- Add parent_user_id column to program_registrations
ALTER TABLE program_registrations
ADD COLUMN IF NOT EXISTS parent_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_registrations_parent_user_id ON program_registrations(parent_user_id);

-- Update RLS policy to allow parents to view their own registrations
CREATE POLICY "Parents can view their own registrations" ON program_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'parent'
      AND id = program_registrations.parent_user_id
    )
  );
