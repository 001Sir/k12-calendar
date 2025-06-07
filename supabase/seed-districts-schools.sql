-- Seed only districts and schools (no user dependency)

-- Insert sample districts
INSERT INTO districts (id, name, region) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'San Francisco Unified School District', 'Bay Area'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Los Angeles Unified School District', 'Southern California')
ON CONFLICT (id) DO NOTHING;

-- Insert sample schools
INSERT INTO schools (id, name, district_id, address) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Lincoln High School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
   '{"street": "2162 24th Ave", "city": "San Francisco", "state": "CA", "zip": "94116"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b12', 'Washington Elementary', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
   '{"street": "3764 California St", "city": "San Francisco", "state": "CA", "zip": "94118"}'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b13', 'Roosevelt Middle School', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
   '{"street": "456 Maple Ave", "city": "Los Angeles", "state": "CA", "zip": "90001"}')
ON CONFLICT (id) DO NOTHING;