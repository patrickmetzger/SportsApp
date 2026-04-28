-- Migration 25: Add archive support to communications

ALTER TABLE communications
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow senders to update their own communications (archive, etc.)
CREATE POLICY "Senders can update their own communications" ON communications
  FOR UPDATE USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
