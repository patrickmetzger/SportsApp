-- Migration 22: Update users role constraint to include assistant_coach

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add updated constraint with assistant_coach
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'school_admin', 'coach', 'assistant_coach', 'student', 'parent'));
