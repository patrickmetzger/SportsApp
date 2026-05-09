-- Migration 30: Add review status tracking to coach_certifications
-- Allows school admins to approve or reject uploaded certifications.

-- Add review columns if they don't already exist
ALTER TABLE coach_certifications
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note   TEXT;

-- Backfill: treat any cert that already has an expiry date set as approved
-- (they were accepted manually prior to this migration)
UPDATE coach_certifications
SET review_status = 'approved'
WHERE expiry_date IS NOT NULL
  AND review_status = 'pending';

-- Index for efficient pending-cert queue queries
CREATE INDEX IF NOT EXISTS coach_certs_review_status_idx
  ON coach_certifications(review_status);
