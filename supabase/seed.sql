-- Seed data for testing

-- Insert sample districts
INSERT INTO districts (id, name, region) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'San Francisco Unified School District', 'Bay Area'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Los Angeles Unified School District', 'Southern California');

-- Insert sample schools
INSERT INTO schools (id, name, district_id, address) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Lincoln High School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
   '{"street": "2162 24th Ave", "city": "San Francisco", "state": "CA", "zip": "94116"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Washington Elementary', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   '{"street": "3764 California St", "city": "San Francisco", "state": "CA", "zip": "94118"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Roosevelt Middle School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
   '{"street": "456 Maple Ave", "city": "Los Angeles", "state": "CA", "zip": "90001"}');

-- Note: To add sample events, you'll need to:
-- 1. Create a test user account through the app
-- 2. Update their profile role to 'school_admin'
-- 3. Then run this query with their user ID:

/*
-- Example events (replace 'YOUR_USER_ID' with actual user ID)
INSERT INTO events (school_id, title, description, start_time, end_time, location, capacity, event_type, requires_rsvp, created_by) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Science Fair 2024', 'Annual student science fair showcasing innovative projects', 
   '2024-11-20 09:00:00-08', '2024-11-20 15:00:00-08', 'Main Gymnasium', 500, 'academic', true, 'YOUR_USER_ID'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Parent-Teacher Conference', 'Fall semester parent-teacher meetings', 
   '2024-11-22 16:00:00-08', '2024-11-22 20:00:00-08', 'Various Classrooms', 200, 'meeting', true, 'YOUR_USER_ID'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Winter Concert', 'Holiday music performance by school bands and choir', 
   '2024-12-15 18:00:00-08', '2024-12-15 20:00:00-08', 'Auditorium', 300, 'performance', true, 'YOUR_USER_ID'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Book Fair', 'Annual scholastic book fair', 
   '2024-11-25 08:00:00-08', '2024-11-29 16:00:00-08', 'Library', 100, 'fundraiser', false, 'YOUR_USER_ID'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Fall Festival', 'Community celebration with games, food, and activities', 
   '2024-10-31 15:00:00-08', '2024-10-31 18:00:00-08', 'School Playground', 400, 'social', false, 'YOUR_USER_ID');
*/

-- Query to check your data
-- SELECT * FROM districts;
-- SELECT * FROM schools;
-- SELECT * FROM events;