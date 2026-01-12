-- Migration 6: Backfill Payment Data for Existing Registrations

-- Update all existing registrations with payment information from their programs
UPDATE program_registrations pr
SET
  amount_due = COALESCE(sp.cost, 0),
  amount_paid = COALESCE(pr.amount_paid, 0),
  payment_status = COALESCE(pr.payment_status, 'pending'),
  payment_due_date = COALESCE(pr.payment_due_date, sp.start_date)
FROM summer_programs sp
WHERE pr.program_id = sp.id
  AND (
    pr.amount_due IS NULL
    OR pr.amount_due = 0
    OR pr.payment_status IS NULL
  );

-- Display summary of updated registrations
SELECT
  COUNT(*) as total_registrations_updated,
  SUM(amount_due) as total_amount_due,
  SUM(amount_paid) as total_amount_paid
FROM program_registrations
WHERE payment_status IS NOT NULL;
