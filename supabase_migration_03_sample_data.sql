-- Migration 3: Insert Sample Data

-- Insert mock students
INSERT INTO mock_students (student_id, first_name, last_name, grade) VALUES
  ('STU001', 'Emma', 'Johnson', 9),
  ('STU002', 'Liam', 'Williams', 10),
  ('STU003', 'Olivia', 'Brown', 11),
  ('STU004', 'Noah', 'Jones', 9),
  ('STU005', 'Ava', 'Garcia', 10),
  ('STU006', 'Ethan', 'Martinez', 12),
  ('STU007', 'Sophia', 'Rodriguez', 9),
  ('STU008', 'Mason', 'Hernandez', 11),
  ('STU009', 'Isabella', 'Lopez', 10),
  ('STU010', 'William', 'Gonzalez', 9),
  ('STU011', 'Mia', 'Wilson', 12),
  ('STU012', 'James', 'Anderson', 10);

-- Insert sample programs
INSERT INTO summer_programs (name, description, start_date, end_date, registration_deadline, cost, requirements) VALUES
  (
    'Basketball Summer Camp',
    'Intensive basketball training camp for all skill levels. Focus on fundamentals, teamwork, and competitive play. Our experienced coaches will help players develop their skills through drills, scrimmages, and personalized instruction.',
    '2025-07-01',
    '2025-07-14',
    '2025-06-15',
    299.99,
    '["Basketball shoes", "Athletic wear", "Water bottle", "Signed waiver"]'::jsonb
  ),
  (
    'Soccer Development Program',
    'Comprehensive soccer program focusing on technical skills, tactical awareness, and physical conditioning. Perfect for players looking to improve their game and prepare for the upcoming season.',
    '2025-07-08',
    '2025-07-28',
    '2025-06-20',
    349.99,
    '["Cleats", "Shin guards", "Soccer ball", "Athletic clothing", "Medical clearance"]'::jsonb
  ),
  (
    'Multi-Sport Adventure Camp',
    'Experience various sports including tennis, volleyball, swimming, and track. Perfect for students who want to try different activities and stay active all summer long. All equipment provided!',
    '2025-06-15',
    '2025-07-10',
    '2025-06-01',
    399.99,
    '["Athletic shoes", "Swimsuit", "Towel", "Sunscreen", "Emergency contact form"]'::jsonb
  );

-- Link coaches to programs
-- NOTE: You need to replace the email addresses below with actual coach emails from your users table
-- Or you can manually link coaches after running this migration

-- Example (uncomment and update with actual coach emails):
-- INSERT INTO program_coaches (program_id, coach_id, role)
-- SELECT p.id, u.id, 'head coach'
-- FROM summer_programs p, users u
-- WHERE p.name = 'Basketball Summer Camp' AND u.email = 'coach1@example.com';

-- INSERT INTO program_coaches (program_id, coach_id, role)
-- SELECT p.id, u.id, 'head coach'
-- FROM summer_programs p, users u
-- WHERE p.name = 'Soccer Development Program' AND u.email = 'coach2@example.com';

-- INSERT INTO program_coaches (program_id, coach_id, role)
-- SELECT p.id, u.id, 'assistant'
-- FROM summer_programs p, users u
-- WHERE p.name = 'Multi-Sport Adventure Camp' AND u.email = 'coach3@example.com';
