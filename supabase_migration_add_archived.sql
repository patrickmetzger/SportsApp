-- Add archived column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Update existing users to not be archived
UPDATE users SET archived = FALSE WHERE archived IS NULL;
