-- Add more sample events to make the app look fuller
-- Run this after quick-setup.sql

-- Get the first school admin user
WITH first_admin AS (
  SELECT user_id, school_id 
  FROM profiles 
  WHERE role = 'school_admin' 
  AND school_id IS NOT NULL 
  LIMIT 1
)
-- Insert various types of events
INSERT INTO events (school_id, title, description, start_time, end_time, location, capacity, event_type, requires_rsvp, requires_payment, price, created_by, status)
SELECT 
  fa.school_id,
  event_data.title,
  event_data.description,
  event_data.start_time,
  event_data.end_time,
  event_data.location,
  event_data.capacity,
  event_data.event_type,
  event_data.requires_rsvp,
  event_data.requires_payment,
  event_data.price,
  fa.user_id,
  'active'
FROM first_admin fa
CROSS JOIN (
  VALUES 
    -- Academic Events
    ('Science Fair 2025', 'Annual student science fair showcasing innovative projects', 
     NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '6 hours', 
     'Main Gymnasium', 500, 'academic', true, false, 0),
    
    ('Math Competition', 'Regional mathematics competition for grades 9-12', 
     NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '3 hours', 
     'Auditorium', 200, 'academic', true, false, 0),
    
    ('AP Exam Prep Session', 'Preparation workshop for upcoming AP exams', 
     NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', 
     'Library', 50, 'academic', true, false, 0),
    
    -- Sports Events
    ('Basketball vs Jefferson High', 'Home game - come support our team!', 
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 
     'Sports Complex', 1000, 'sports', true, true, 5.00),
    
    ('Track and Field Meet', 'Annual spring track meet', 
     NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '4 hours', 
     'Athletic Field', 800, 'sports', false, false, 0),
    
    -- Arts & Culture
    ('Spring Musical: Hamilton', 'Student production of the hit Broadway show', 
     NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days' + INTERVAL '3 hours', 
     'Theater', 400, 'arts', true, true, 15.00),
    
    ('Art Gallery Opening', 'Student artwork exhibition', 
     NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '2 hours', 
     'Art Gallery', 150, 'arts', false, false, 0),
    
    -- Fundraisers
    ('PTA Bake Sale', 'Support our school programs with delicious baked goods', 
     NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '4 hours', 
     'Main Entrance', null, 'fundraiser', false, false, 0),
    
    ('Spring Carnival', 'Family fun day with games, food, and prizes', 
     NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days' + INTERVAL '5 hours', 
     'School Grounds', 1500, 'fundraiser', true, true, 10.00),
    
    -- Meetings
    ('Parent-Teacher Conference', 'Schedule your meeting with teachers', 
     NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '4 hours', 
     'Various Classrooms', 300, 'meeting', true, false, 0),
    
    ('School Board Meeting', 'Monthly board meeting - public welcome', 
     NOW() + INTERVAL '18 days', NOW() + INTERVAL '18 days' + INTERVAL '2 hours', 
     'Board Room', 50, 'meeting', false, false, 0),
    
    -- Other Events
    ('Senior Prom', 'A night to remember for the Class of 2025', 
     NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days' + INTERVAL '4 hours', 
     'Grand Ballroom', 400, 'other', true, true, 75.00),
    
    ('Graduation Ceremony', 'Celebrating the Class of 2025', 
     NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days' + INTERVAL '3 hours', 
     'Football Stadium', 2000, 'other', true, false, 0)
) AS event_data(title, description, start_time, end_time, location, capacity, event_type, requires_rsvp, requires_payment, price)
WHERE NOT EXISTS (
  SELECT 1 FROM events WHERE title = event_data.title
);

-- Add some RSVPs to make events look active
INSERT INTO event_attendees (event_id, user_id, rsvp_status, guests_count)
SELECT 
  e.id,
  p.user_id,
  'confirmed',
  floor(random() * 3)::int
FROM events e
CROSS JOIN LATERAL (
  SELECT user_id 
  FROM profiles 
  WHERE user_id != e.created_by 
  LIMIT floor(random() * 5 + 1)::int
) p
WHERE e.requires_rsvp = true
  AND e.capacity > 0
  AND NOT EXISTS (
    SELECT 1 FROM event_attendees 
    WHERE event_id = e.id AND user_id = p.user_id
  )
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Show summary
SELECT 
  event_type,
  COUNT(*) as count,
  COUNT(CASE WHEN requires_payment THEN 1 END) as paid_events,
  COUNT(CASE WHEN requires_rsvp THEN 1 END) as rsvp_events
FROM events
GROUP BY event_type
ORDER BY count DESC;