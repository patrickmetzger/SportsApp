-- Migration 31: Realistic mock parent + student data (K-12)
-- Creates auth users, users table rows, and parent_children records.
-- Passwords are not set — these accounts use magic link only.
-- Run AFTER migrations 28-30.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: insert a user into auth.users then users table.
-- We use a fixed UUID per record so the data is stable across re-runs.
-- ─────────────────────────────────────────────────────────────────────────────

-- Parent 1 — Maria Santos (2 elementary-age kids)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a1000001-0000-0000-0000-000000000001',
  'maria.santos@example.com',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Maria","last_name":"Santos"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role, first_name, last_name)
VALUES ('a1000001-0000-0000-0000-000000000001', 'maria.santos@example.com', 'parent', 'Maria', 'Santos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('a1000001-0000-0000-0000-000000000001', 'parent')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO parent_children (parent_user_id, first_name, last_name, grade, date_of_birth, gender, student_id)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Diego',  'Santos', 2, '2017-03-14', 'male',   'STU-MS-001'),
  ('a1000001-0000-0000-0000-000000000001', 'Lucia',  'Santos', 5, '2014-09-22', 'female', 'STU-MS-002')
ON CONFLICT DO NOTHING;

-- Parent 2 — David and Karen Chen (twin middle-schoolers, one in HS)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a1000002-0000-0000-0000-000000000002',
  'karen.chen@example.com',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Karen","last_name":"Chen"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role, first_name, last_name)
VALUES ('a1000002-0000-0000-0000-000000000002', 'karen.chen@example.com', 'parent', 'Karen', 'Chen')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('a1000002-0000-0000-0000-000000000002', 'parent')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO parent_children (parent_user_id, first_name, last_name, grade, date_of_birth, gender, student_id)
VALUES
  ('a1000002-0000-0000-0000-000000000002', 'Ethan',  'Chen', 7,  '2012-06-01', 'male',   'STU-KC-001'),
  ('a1000002-0000-0000-0000-000000000002', 'Emma',   'Chen', 7,  '2012-06-01', 'female', 'STU-KC-002'),
  ('a1000002-0000-0000-0000-000000000002', 'Oliver', 'Chen', 10, '2009-11-30', 'male',   'STU-KC-003')
ON CONFLICT DO NOTHING;

-- Parent 3 — James Okafor (one high-school senior)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a1000003-0000-0000-0000-000000000003',
  'james.okafor@example.com',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"James","last_name":"Okafor"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role, first_name, last_name)
VALUES ('a1000003-0000-0000-0000-000000000003', 'james.okafor@example.com', 'parent', 'James', 'Okafor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('a1000003-0000-0000-0000-000000000003', 'parent')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO parent_children (parent_user_id, first_name, last_name, grade, date_of_birth, gender, student_id)
VALUES
  ('a1000003-0000-0000-0000-000000000003', 'Amara', 'Okafor', 12, '2007-02-18', 'female', 'STU-JO-001')
ON CONFLICT DO NOTHING;

-- Parent 4 — Rebecca Torres (three kids spanning K-12)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a1000004-0000-0000-0000-000000000004',
  'rebecca.torres@example.com',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Rebecca","last_name":"Torres"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role, first_name, last_name)
VALUES ('a1000004-0000-0000-0000-000000000004', 'rebecca.torres@example.com', 'parent', 'Rebecca', 'Torres')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('a1000004-0000-0000-0000-000000000004', 'parent')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO parent_children (parent_user_id, first_name, last_name, grade, date_of_birth, gender, student_id)
VALUES
  ('a1000004-0000-0000-0000-000000000004', 'Sofia',  'Torres', 1,  '2018-08-05', 'female', 'STU-RT-001'),
  ('a1000004-0000-0000-0000-000000000004', 'Miguel', 'Torres', 6,  '2013-04-12', 'male',   'STU-RT-002'),
  ('a1000004-0000-0000-0000-000000000004', 'Valeria','Torres', 11, '2008-12-01', 'female', 'STU-RT-003')
ON CONFLICT DO NOTHING;

-- Parent 5 — Priya Patel (one middle-schooler, multi-role: also a coach)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a1000005-0000-0000-0000-000000000005',
  'priya.patel@example.com',
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Priya","last_name":"Patel"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, role, first_name, last_name)
VALUES ('a1000005-0000-0000-0000-000000000005', 'priya.patel@example.com', 'coach', 'Priya', 'Patel')
ON CONFLICT (id) DO NOTHING;

-- Multi-role: Priya is both a coach (primary) and a parent
INSERT INTO user_roles (user_id, role)
VALUES
  ('a1000005-0000-0000-0000-000000000005', 'coach'),
  ('a1000005-0000-0000-0000-000000000005', 'parent')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO parent_children (parent_user_id, first_name, last_name, grade, date_of_birth, gender, student_id)
VALUES
  ('a1000005-0000-0000-0000-000000000005', 'Rohan', 'Patel', 8, '2011-07-29', 'male', 'STU-PP-001')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Additional mock_students (K-12 spread for validation/search testing)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO mock_students (student_id, first_name, last_name, grade) VALUES
  ('STU031', 'Zoe',      'Nguyen',    0),
  ('STU032', 'Liam',     'Patel',     1),
  ('STU033', 'Avery',    'Kim',       3),
  ('STU034', 'Jordan',   'Williams',  4),
  ('STU035', 'Nadia',    'Hassan',    5),
  ('STU036', 'Carlos',   'Rivera',    6),
  ('STU037', 'Aaliyah',  'Jackson',   7),
  ('STU038', 'Finn',     'Murphy',    8),
  ('STU039', 'Isabelle', 'Dubois',    9),
  ('STU040', 'Marcus',   'Thompson',  10),
  ('STU041', 'Hannah',   'Kowalski',  11),
  ('STU042', 'Tyler',    'Brooks',    12)
ON CONFLICT (student_id) DO NOTHING;
