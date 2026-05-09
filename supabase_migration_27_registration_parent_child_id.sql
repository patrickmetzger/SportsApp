-- Add parent_child_id to track which parent_children record this registration came from.
-- No FK constraint so the column stays populated after a child is deleted
-- (lets us detect "registered via portal, child later removed" vs "admin registration").
ALTER TABLE program_registrations
  ADD COLUMN IF NOT EXISTS parent_child_id UUID;
