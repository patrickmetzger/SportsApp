-- Migration 7: Add Eligibility Criteria to Summer Programs

-- Add eligibility columns to summer_programs table
ALTER TABLE summer_programs
ADD COLUMN IF NOT EXISTS min_grade INTEGER,
ADD COLUMN IF NOT EXISTS max_grade INTEGER,
ADD COLUMN IF NOT EXISTS min_age INTEGER,
ADD COLUMN IF NOT EXISTS max_age INTEGER,
ADD COLUMN IF NOT EXISTS gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female', 'any')),
ADD COLUMN IF NOT EXISTS eligibility_notes TEXT;

-- Set default values for existing programs (no restrictions)
UPDATE summer_programs
SET
  gender_restriction = 'any'
WHERE gender_restriction IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN summer_programs.min_grade IS 'Minimum grade level required (e.g., 9 for 9th grade)';
COMMENT ON COLUMN summer_programs.max_grade IS 'Maximum grade level allowed (e.g., 12 for 12th grade)';
COMMENT ON COLUMN summer_programs.min_age IS 'Minimum age in years';
COMMENT ON COLUMN summer_programs.max_age IS 'Maximum age in years';
COMMENT ON COLUMN summer_programs.gender_restriction IS 'Gender restriction: male, female, or any';
COMMENT ON COLUMN summer_programs.eligibility_notes IS 'Additional eligibility notes or requirements';
