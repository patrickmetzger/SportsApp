-- Migration 29: Program change request workflow
-- Coaches assigned to a program can submit change requests instead of editing directly.
-- School admins review and approve/reject them with a diff view.

CREATE TABLE IF NOT EXISTS program_change_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES summer_programs(id) ON DELETE CASCADE,
  submitted_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Snapshot of requested changes (only fields that differ from current)
  changes         JSONB NOT NULL DEFAULT '{}',

  -- Optional message from the coach explaining the request
  notes           TEXT,

  -- Review fields populated when school admin acts
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_program_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER program_change_requests_updated_at
  BEFORE UPDATE ON program_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_program_change_requests_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS pcr_program_id_idx  ON program_change_requests(program_id);
CREATE INDEX IF NOT EXISTS pcr_submitted_by_idx ON program_change_requests(submitted_by);
CREATE INDEX IF NOT EXISTS pcr_status_idx       ON program_change_requests(status);

-- RLS
ALTER TABLE program_change_requests ENABLE ROW LEVEL SECURITY;

-- Coaches can see their own requests
CREATE POLICY "coaches can view their own change requests"
  ON program_change_requests FOR SELECT
  USING (submitted_by = auth.uid());

-- Coaches can insert new requests
CREATE POLICY "coaches can submit change requests"
  ON program_change_requests FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

-- School admins can view all requests for programs at their school
CREATE POLICY "school admins can view change requests"
  ON program_change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN summer_programs sp ON sp.school_id = u.school_id
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND sp.id = program_change_requests.program_id
    )
  );

-- School admins can update (approve/reject) change requests at their school
CREATE POLICY "school admins can review change requests"
  ON program_change_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN summer_programs sp ON sp.school_id = u.school_id
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND sp.id = program_change_requests.program_id
    )
  );

-- Admins can see and manage everything
CREATE POLICY "admins can manage all change requests"
  ON program_change_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
