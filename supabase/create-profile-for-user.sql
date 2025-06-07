-- Create profile for the specific user if it doesn't exist
INSERT INTO profiles (user_id, full_name, role, created_at)
VALUES (
  'dc722872-a550-4223-b747-ac484cfe0de6',
  (SELECT email FROM auth.users WHERE id = 'dc722872-a550-4223-b747-ac484cfe0de6'),
  'parent',
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the profile was created
SELECT * FROM profiles WHERE user_id = 'dc722872-a550-4223-b747-ac484cfe0de6';