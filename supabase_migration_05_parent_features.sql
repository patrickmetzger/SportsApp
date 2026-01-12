-- Migration 5: Parent Dashboard Features (Payments & Children)

-- Add payment tracking to program_registrations
ALTER TABLE program_registrations
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_due_date DATE;

-- Create parent_children table to link parents to their children
CREATE TABLE IF NOT EXISTS parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  student_id TEXT,
  date_of_birth DATE,
  grade INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_children
CREATE POLICY "Parents can view their own children" ON parent_children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'parent'
      AND id = parent_children.parent_user_id
    )
  );

CREATE POLICY "Parents can insert their own children" ON parent_children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'parent'
      AND id = parent_children.parent_user_id
    )
  );

CREATE POLICY "Parents can update their own children" ON parent_children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'parent'
      AND id = parent_children.parent_user_id
    )
  );

CREATE POLICY "Parents can delete their own children" ON parent_children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'parent'
      AND id = parent_children.parent_user_id
    )
  );

CREATE POLICY "Admins can manage all children" ON parent_children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_parent_children_parent_user_id ON parent_children(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_student_id ON parent_children(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON program_registrations(payment_status);
