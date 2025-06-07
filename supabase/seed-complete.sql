-- Complete seed file for K12Calendar
-- Run this after creating the schema

-- Clear existing data (optional - be careful in production!)
-- DELETE FROM event_attendees;
-- DELETE FROM events;
-- DELETE FROM profiles;
-- DELETE FROM schools;
-- DELETE FROM districts;

-- Insert sample districts
INSERT INTO districts (id, name, region) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'San Francisco Unified School District', 'Bay Area'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Los Angeles Unified School District', 'Southern California'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'San Diego Unified School District', 'Southern California')
ON CONFLICT (id) DO NOTHING;

-- Insert sample schools
INSERT INTO schools (id, name, district_id, address) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Lincoln High School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
   '{"street": "2162 24th Ave", "city": "San Francisco", "state": "CA", "zip": "94116"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Washington Elementary', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   '{"street": "3764 California St", "city": "San Francisco", "state": "CA", "zip": "94118"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Roosevelt Middle School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
   '{"street": "456 Maple Ave", "city": "Los Angeles", "state": "CA", "zip": "90001"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b14', 'Jefferson Elementary', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
   '{"street": "789 Oak St", "city": "Los Angeles", "state": "CA", "zip": "90002"}')
ON CONFLICT (id) DO NOTHING;

-- Create a demo user if it doesn't exist (you'll need to update this with a real user ID after signup)
-- This is just a placeholder - replace with actual user IDs after creating accounts

-- Sample events (adjust dates to be current)
-- NOTE: You need to replace 'YOUR_USER_ID' with an actual user ID from your auth.users table
-- You can get this by signing up a test account and checking the auth.users table

-- After you have a user ID, uncomment and run this section:
/*
-- Update your test user to be a school admin
UPDATE profiles 
SET role = 'school_admin', 
    school_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'
WHERE user_id = 'YOUR_USER_ID';

-- Insert sample events
INSERT INTO events (school_id, title, description, start_time, end_time, location, capacity, event_type, requires_rsvp, requires_payment, price, created_by, status) VALUES
  -- Lincoln High School events
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Science Fair 2025', 'Annual student science fair showcasing innovative projects from all grade levels. Parents and community members welcome!', 
   '2025-02-20 09:00:00-08', '2025-02-20 15:00:00-08', 'Main Gymnasium', 500, 'academic', true, false, 0, 'YOUR_USER_ID', 'active'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Parent-Teacher Conference', 'Spring semester parent-teacher meetings. Schedule your 15-minute slot with your child''s teachers.', 
   '2025-02-22 16:00:00-08', '2025-02-22 20:00:00-08', 'Various Classrooms', 200, 'meeting', true, false, 0, 'YOUR_USER_ID', 'active'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Winter Concert', 'Holiday music performance by school bands and choir. Featuring classical and contemporary pieces.', 
   '2025-12-15 18:00:00-08', '2025-12-15 20:00:00-08', 'Auditorium', 300, 'arts', true, true, 10.00, 'YOUR_USER_ID', 'active'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Basketball Championship', 'Finals game vs. Jefferson High. Come support our team!', 
   '2025-02-28 19:00:00-08', '2025-02-28 21:00:00-08', 'Sports Complex', 1000, 'sports', true, true, 5.00, 'YOUR_USER_ID', 'active'),
  
  -- Washington Elementary events
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Book Fair', 'Annual Scholastic Book Fair. All proceeds support our school library.', 
   '2025-03-10 08:00:00-08', '2025-03-14 16:00:00-08', 'Library', 100, 'fundraiser', false, false, 0, 'YOUR_USER_ID', 'active'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Spring Carnival', 'Family fun day with games, food trucks, and entertainment!', 
   '2025-04-20 11:00:00-08', '2025-04-20 16:00:00-08', 'School Grounds', 800, 'fundraiser', true, true, 15.00, 'YOUR_USER_ID', 'active'),
  
  -- Roosevelt Middle School events
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'STEM Workshop', 'Hands-on robotics and coding workshop for 6th-8th graders', 
   '2025-03-05 14:00:00-08', '2025-03-05 17:00:00-08', 'Computer Lab', 30, 'academic', true, false, 0, 'YOUR_USER_ID', 'active'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Drama Club Performance', 'Spring production of "A Midsummer Night''s Dream"', 
   '2025-05-15 19:00:00-08', '2025-05-15 21:30:00-08', 'Theater', 200, 'arts', true, true, 8.00, 'YOUR_USER_ID', 'active');

-- Add some sample RSVPs (replace USER_IDs with actual user IDs)
-- INSERT INTO event_attendees (event_id, user_id, rsvp_status, guests_count) 
-- SELECT id, 'YOUR_USER_ID', 'confirmed', floor(random() * 3)
-- FROM events 
-- LIMIT 3;
*/

-- Instructions:
-- 1. First, create a test account through the app signup
-- 2. Get the user ID from Supabase Auth dashboard or by querying: SELECT id FROM auth.users WHERE email = 'your-test-email@example.com';
-- 3. Replace all instances of 'YOUR_USER_ID' with the actual user ID
-- 4. Run this SQL in your Supabase SQL editor
-- 5. Your app should now show events!