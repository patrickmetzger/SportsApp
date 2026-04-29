-- Migration 26: Add cancelled and refund_requested to program_registrations status

ALTER TABLE program_registrations
  DROP CONSTRAINT IF EXISTS program_registrations_status_check;

ALTER TABLE program_registrations
  ADD CONSTRAINT program_registrations_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refund_requested'));
