-- Migration 23: Assistant Coach Approval Workflow
-- Adds approval_status tracking for assistant coaches

-- Add approval_status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Set existing assistant_coach users to approved
UPDATE users SET approval_status = 'approved' WHERE role = 'assistant_coach';

-- Add audit columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status)
  WHERE role = 'assistant_coach';

-- Create notifications for pending approvals
CREATE TABLE IF NOT EXISTS assistant_approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE(assistant_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_assistant_approval_notifications_school
  ON assistant_approval_notifications(school_id) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE assistant_approval_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assistant_approval_notifications

-- Admins can see all notifications
CREATE POLICY "Admins can manage approval notifications" ON assistant_approval_notifications
  FOR ALL USING (is_admin());

-- School admins can see notifications for their school
CREATE POLICY "School admins can view their school notifications" ON assistant_approval_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND u.school_id = assistant_approval_notifications.school_id
    )
  );

-- School admins can update notifications for their school (mark as read)
CREATE POLICY "School admins can update their school notifications" ON assistant_approval_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND u.school_id = assistant_approval_notifications.school_id
    )
  );
