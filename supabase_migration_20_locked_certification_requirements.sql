-- Add locked_by_admin column to program_certification_requirements
-- When true, coaches cannot remove this requirement from the program

ALTER TABLE program_certification_requirements
ADD COLUMN IF NOT EXISTS locked_by_admin BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN program_certification_requirements.locked_by_admin IS
  'When true, this requirement was set by an admin and cannot be removed by coaches';
