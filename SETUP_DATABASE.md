# Database Setup Guide

## Quick Start

To get your K12Calendar app working with data, follow these steps:

### 1. Navigate to Debug Page
Visit: http://localhost:5173/debug

This will show you:
- If your database tables exist
- How many records are in each table
- Any connection errors

### 2. Run the Seed Data

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to the **SQL Editor**
3. Run these queries in order:

#### Step 1: Run Schema (if not already created)
```sql
-- Copy and paste the contents of /supabase/schema.sql
```

#### Step 2: Seed Districts and Schools
```sql
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
   '{"street": "3764 California St", "city": "San Francisco", "state": "CA", "zip": "94118"}')
ON CONFLICT (id) DO NOTHING;
```

### 3. Create a Test User

1. Go to http://localhost:5173/register
2. Sign up with:
   - Email: admin@test.com
   - Password: test123
   - Role: School Administrator
   - Full Name: Test Admin

### 4. Get Your User ID

After signing up, go back to Supabase SQL Editor and run:
```sql
SELECT id, email FROM auth.users WHERE email = 'admin@test.com';
```

Copy the ID (it will look like: `123e4567-e89b-12d3-a456-426614174000`)

### 5. Update Your Profile and Add Events

Replace `YOUR_USER_ID` with the ID from step 4:

```sql
-- Update your profile to be a school admin
UPDATE profiles 
SET role = 'school_admin', 
    school_id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11'
WHERE user_id = 'YOUR_USER_ID';

-- Insert sample events
INSERT INTO events (school_id, title, description, start_time, end_time, location, capacity, event_type, requires_rsvp, created_by) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Science Fair 2025', 'Annual student science fair', 
   NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '6 hours', 'Main Gymnasium', 500, 'academic', true, 'YOUR_USER_ID'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Parent-Teacher Conference', 'Spring semester meetings', 
   NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '4 hours', 'Various Classrooms', 200, 'meeting', true, 'YOUR_USER_ID'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'Basketball Game', 'Home game vs Jefferson High', 
   NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 'Gymnasium', 1000, 'sports', true, 'YOUR_USER_ID');
```

### 6. Verify Everything Works

1. Go back to http://localhost:5173/debug - You should see data in all tables
2. Login with your test account
3. Visit http://localhost:5173/dashboard - You should see your events
4. Visit http://localhost:5173/explore - You should see public events

## Troubleshooting

### "Loading dashboard data..." stuck
- Check http://localhost:5173/debug
- Make sure you have schools and districts in the database
- Ensure your user profile has a school_id assigned

### No events showing
- Verify events exist in the database (check debug page)
- Make sure event dates are in the future
- Check that events have status = 'active'

### Can't create events
- Ensure your profile role is 'school_admin' or 'teacher'
- Make sure your profile has a school_id

## Next Steps

Once everything is working:
1. Create more test users with different roles (parent, teacher, student)
2. Test RSVP functionality
3. Create events with different settings (paid events, capacity limits)
4. Remove the /debug route before deploying to production