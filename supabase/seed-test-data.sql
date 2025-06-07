-- Test Data Seeding Script for K12 Calendar System
-- This script creates sample data for testing all features
-- Run this AFTER all schema migrations

-- Create a test district
INSERT INTO districts (id, name, state, contact_email, contact_phone)
VALUES ('d1234567-89ab-cdef-0123-456789abcdef', 'Unified School District', 'CA', 'admin@usd.edu', '555-0100')
ON CONFLICT (id) DO NOTHING;

-- Create test schools
INSERT INTO schools (id, district_id, name, address, city, state, zip_code, phone, principal_name, logo_url)
VALUES 
  ('s1234567-89ab-cdef-0123-456789abcdef', 'd1234567-89ab-cdef-0123-456789abcdef', 
   'Lincoln Elementary', '123 Education Blvd', 'Springfield', 'CA', '90210', '555-0101', 
   'Dr. Sarah Johnson', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200'),
  ('s2234567-89ab-cdef-0123-456789abcdef', 'd1234567-89ab-cdef-0123-456789abcdef', 
   'Washington Middle School', '456 Learning Ave', 'Springfield', 'CA', '90211', '555-0102', 
   'Mr. Robert Chen', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200')
ON CONFLICT (id) DO NOTHING;

-- Note: User profiles should be created through the auth system first
-- After users sign up, update their profiles with these commands:

-- Update admin user profile
-- UPDATE profiles SET 
--   role = 'school_admin',
--   school_id = 's1234567-89ab-cdef-0123-456789abcdef',
--   full_name = 'Admin User'
-- WHERE email = 'admin@test.com';

-- Update teacher user profile
-- UPDATE profiles SET 
--   role = 'teacher',
--   school_id = 's1234567-89ab-cdef-0123-456789abcdef',
--   full_name = 'Teacher Smith'
-- WHERE email = 'teacher@test.com';

-- Update parent user profile
-- UPDATE profiles SET 
--   role = 'parent',
--   full_name = 'Parent Johnson'
-- WHERE email = 'parent@test.com';

-- Create classrooms
INSERT INTO classrooms (id, school_id, name, grade_level, room_number, capacity)
VALUES
  ('c1234567-89ab-cdef-0123-456789abcdef', 's1234567-89ab-cdef-0123-456789abcdef', 
   'Grade 1 - Class A', '1', '101', 25),
  ('c2234567-89ab-cdef-0123-456789abcdef', 's1234567-89ab-cdef-0123-456789abcdef', 
   'Grade 2 - Class A', '2', '201', 25),
  ('c3234567-89ab-cdef-0123-456789abcdef', 's1234567-89ab-cdef-0123-456789abcdef', 
   'Grade 3 - Class A', '3', '301', 25),
  ('c4234567-89ab-cdef-0123-456789abcdef', 's1234567-89ab-cdef-0123-456789abcdef', 
   'Grade 4 - Class A', '4', '401', 25),
  ('c5234567-89ab-cdef-0123-456789abcdef', 's1234567-89ab-cdef-0123-456789abcdef', 
   'Grade 5 - Class A', '5', '501', 25)
ON CONFLICT (id) DO NOTHING;

-- Assign teacher to classroom (update with actual teacher ID after user creation)
-- UPDATE classrooms 
-- SET teacher_id = (SELECT id FROM profiles WHERE email = 'teacher@test.com')
-- WHERE id = 'c5234567-89ab-cdef-0123-456789abcdef';

-- Create test students (update parent_id after parent user creation)
-- INSERT INTO students (first_name, last_name, date_of_birth, grade_level, school_id, parent_id, classroom_id, student_id)
-- SELECT 
--   'Emma', 'Johnson', '2015-08-15', '5', 's1234567-89ab-cdef-0123-456789abcdef',
--   (SELECT id FROM profiles WHERE email = 'parent@test.com'),
--   'c5234567-89ab-cdef-0123-456789abcdef',
--   'STU-2024-001'
-- WHERE EXISTS (SELECT 1 FROM profiles WHERE email = 'parent@test.com');

-- INSERT INTO students (first_name, last_name, date_of_birth, grade_level, school_id, parent_id, classroom_id, student_id)
-- SELECT 
--   'Michael', 'Johnson', '2017-03-22', '3', 's1234567-89ab-cdef-0123-456789abcdef',
--   (SELECT id FROM profiles WHERE email = 'parent@test.com'),
--   'c3234567-89ab-cdef-0123-456789abcdef',
--   'STU-2024-002'
-- WHERE EXISTS (SELECT 1 FROM profiles WHERE email = 'parent@test.com');

-- Create sample events
INSERT INTO events (
  title, description, start_time, end_time, location, 
  event_type, school_id, created_by, max_attendees, 
  requires_rsvp, is_public, status, price
)
VALUES
  -- School-wide events
  ('Spring Science Fair', 'Annual science fair showcasing student projects', 
   NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
   'School Gymnasium', 'academic', 's1234567-89ab-cdef-0123-456789abcdef',
   (SELECT id FROM profiles WHERE role = 'school_admin' LIMIT 1),
   500, true, true, 'upcoming', 0),
   
  ('Parent-Teacher Conference', 'Meet with your child''s teacher to discuss progress',
   NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '4 hours',
   'Individual Classrooms', 'meeting', 's1234567-89ab-cdef-0123-456789abcdef',
   (SELECT id FROM profiles WHERE role = 'school_admin' LIMIT 1),
   200, true, false, 'upcoming', 0),
   
  ('School Carnival', 'Fun family event with games, food, and prizes',
   NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '5 hours',
   'School Grounds', 'social', 's1234567-89ab-cdef-0123-456789abcdef',
   (SELECT id FROM profiles WHERE role = 'school_admin' LIMIT 1),
   1000, true, true, 'upcoming', 5),
   
  -- Class-specific event
  ('5th Grade Field Trip', 'Educational trip to the Science Museum',
   NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '6 hours',
   'City Science Museum', 'field_trip', 's1234567-89ab-cdef-0123-456789abcdef',
   (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1),
   30, true, false, 'upcoming', 15)
ON CONFLICT DO NOTHING;

-- Create lunch accounts for students (run after students are created)
-- INSERT INTO lunch_accounts (student_id, balance, auto_reload_enabled, auto_reload_amount, auto_reload_threshold)
-- SELECT 
--   s.id, 25.50, true, 20.00, 5.00
-- FROM students s
-- WHERE s.parent_id = (SELECT id FROM profiles WHERE email = 'parent@test.com');

-- Create sample academic records (run after students are created)
-- INSERT INTO academic_records (
--   student_id, teacher_id, school_id, term, year, grade_level,
--   gpa, attendance_rate, subject_grades, comments
-- )
-- SELECT 
--   s.id,
--   c.teacher_id,
--   's1234567-89ab-cdef-0123-456789abcdef',
--   'Fall',
--   '2024',
--   s.grade_level,
--   3.8,
--   96,
--   '{"Math": "A", "Science": "A-", "English": "B+", "History": "A", "PE": "A"}',
--   'Excellent student, participates actively in class.'
-- FROM students s
-- JOIN classrooms c ON s.classroom_id = c.id
-- WHERE s.parent_id = (SELECT id FROM profiles WHERE email = 'parent@test.com');

-- Create sample parent communications (run after parent and teacher users exist)
-- INSERT INTO parent_communications (
--   parent_id, sender_id, student_id, subject, message, 
--   priority, category
-- )
-- SELECT 
--   p.id,
--   t.id,
--   s.id,
--   'Field Trip Permission Required',
--   'Please sign and return the permission slip for the upcoming Science Museum field trip by Friday.',
--   'urgent',
--   'permission'
-- FROM profiles p
-- CROSS JOIN profiles t
-- CROSS JOIN students s
-- WHERE p.email = 'parent@test.com'
--   AND t.email = 'teacher@test.com'
--   AND s.parent_id = p.id
--   AND s.first_name = 'Emma';

-- Create volunteer opportunities
INSERT INTO volunteer_opportunities (
  school_id, title, description, date, start_time, end_time,
  location, spots_available, category
)
VALUES
  ('s1234567-89ab-cdef-0123-456789abcdef',
   'Science Fair Judges Needed',
   'Help judge student science projects',
   NOW()::DATE + INTERVAL '7 days',
   '09:00:00',
   '12:00:00',
   'School Gymnasium',
   10,
   'academic'),
   
  ('s1234567-89ab-cdef-0123-456789abcdef',
   'Carnival Setup Crew',
   'Help set up booths and decorations for the school carnival',
   NOW()::DATE + INTERVAL '29 days',
   '14:00:00',
   '18:00:00',
   'School Grounds',
   20,
   'event')
ON CONFLICT DO NOTHING;

-- Output verification
SELECT 'Test data seeding complete!' as status;
SELECT 'Districts created:' as entity, COUNT(*) as count FROM districts;
SELECT 'Schools created:' as entity, COUNT(*) as count FROM schools;
SELECT 'Classrooms created:' as entity, COUNT(*) as count FROM classrooms;
SELECT 'Events created:' as entity, COUNT(*) as count FROM events;
SELECT 'Volunteer opportunities:' as entity, COUNT(*) as count FROM volunteer_opportunities;

-- Instructions for completing setup:
SELECT '
Next steps:
1. Create test users via your app signup:
   - admin@test.com (School Admin)
   - teacher@test.com (Teacher)
   - parent@test.com (Parent)
   
2. Run the UPDATE statements in this file (currently commented out)
   to assign roles and relationships
   
3. Create students and other relationships using the commented INSERT statements
   
4. Test each user role by logging in with the test accounts
' as instructions;