-- Migration 8: Add Date of Birth and Gender to Mock Students and Parent Children

-- Add demographic columns to mock_students table
ALTER TABLE mock_students
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Add demographic columns to parent_children table
ALTER TABLE parent_children
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- Add comments for documentation
COMMENT ON COLUMN mock_students.date_of_birth IS 'Student date of birth for age-based eligibility';
COMMENT ON COLUMN mock_students.gender IS 'Student gender: male or female';
COMMENT ON COLUMN parent_children.gender IS 'Student gender: male or female';

-- Update existing students with sample data (adjust these as needed)
-- Students STU001-STU012 with varied ages and genders

UPDATE mock_students SET date_of_birth = '2010-03-15', gender = 'male' WHERE student_id = 'STU001';
UPDATE mock_students SET date_of_birth = '2011-07-22', gender = 'female' WHERE student_id = 'STU002';
UPDATE mock_students SET date_of_birth = '2009-11-08', gender = 'male' WHERE student_id = 'STU003';
UPDATE mock_students SET date_of_birth = '2012-01-30', gender = 'female' WHERE student_id = 'STU004';
UPDATE mock_students SET date_of_birth = '2010-09-14', gender = 'male' WHERE student_id = 'STU005';
UPDATE mock_students SET date_of_birth = '2011-05-19', gender = 'female' WHERE student_id = 'STU006';
UPDATE mock_students SET date_of_birth = '2008-12-03', gender = 'male' WHERE student_id = 'STU007';
UPDATE mock_students SET date_of_birth = '2013-04-27', gender = 'female' WHERE student_id = 'STU008';
UPDATE mock_students SET date_of_birth = '2009-08-11', gender = 'male' WHERE student_id = 'STU009';
UPDATE mock_students SET date_of_birth = '2012-10-05', gender = 'female' WHERE student_id = 'STU010';
UPDATE mock_students SET date_of_birth = '2010-06-20', gender = 'male' WHERE student_id = 'STU011';
UPDATE mock_students SET date_of_birth = '2011-02-16', gender = 'female' WHERE student_id = 'STU012';
