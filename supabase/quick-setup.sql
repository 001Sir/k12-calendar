-- Quick Setup Script for K12Calendar
-- This script sets up your database with sample data

-- Step 1: Insert Districts and Schools
INSERT INTO districts (id, name, region) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'San Francisco Unified School District', 'Bay Area'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Los Angeles Unified School District', 'Southern California')
ON CONFLICT (id) DO NOTHING;

INSERT INTO schools (id, name, district_id, address) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Lincoln High School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
   '{"street": "2162 24th Ave", "city": "San Francisco", "state": "CA", "zip": "94116"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Washington Elementary', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   '{"street": "3764 California St", "city": "San Francisco", "state": "CA", "zip": "94118"}')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Check if you have any users and show them
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Step 3: Update ALL existing users to be school admins (for testing)
-- This will make any logged in user a school admin at Lincoln High School
UPDATE profiles 
SET school_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    role = 'school_admin'
WHERE school_id IS NULL;

-- Step 4: Add sample events for ALL users who are school admins
INSERT INTO events (school_id, title, description, start_time, end_time, location, capacity, event_type, requires_rsvp, created_by)
SELECT 
  p.school_id,
  'Welcome Event - ' || p.full_name,
  'A welcome event created for testing purposes',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
  'Main Hall',
  100,
  'meeting',
  true,
  p.user_id
FROM profiles p
WHERE p.role = 'school_admin' 
  AND p.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM events e WHERE e.created_by = p.user_id
  );

-- Step 5: Show the results
SELECT 'Districts:' as table_name, COUNT(*) as count FROM districts
UNION ALL
SELECT 'Schools:', COUNT(*) FROM schools
UNION ALL
SELECT 'Profiles with Schools:', COUNT(*) FROM profiles WHERE school_id IS NOT NULL
UNION ALL
SELECT 'Events:', COUNT(*) FROM events
UNION ALL
SELECT 'Users:', COUNT(*) FROM auth.users;