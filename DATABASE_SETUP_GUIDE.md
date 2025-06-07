# K12 Calendar Database Setup Guide

## Prerequisites
- Supabase account and project created
- Database connection credentials
- SQL client (psql, TablePlus, or Supabase SQL Editor)

## Database Migration Order

Execute the SQL files in this exact order to ensure proper table creation and relationships:

### 1. Base Schema (`schema.sql`)
Creates the foundational tables:
- `districts` - School district information
- `schools` - Individual schools
- `profiles` - User profiles with roles
- `events` - School events
- `event_attendees` - Event RSVPs and attendance
- `event_checkins` - Event check-in tracking
- `notifications` - User notifications
- `activities` - Activity logging

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql
```

### 2. User Preferences (`create-missing-tables.sql`)
Adds user customization tables:
- `user_preferences` - User settings and preferences
- `profile_views` - Profile view tracking

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/create-missing-tables.sql
```

### 3. Parent Features (`parent-features-schema.sql`)
Implements parent-specific functionality:
- `students` - Student records linked to parents
- `parent_communications` - Parent-teacher messaging
- `academic_records` - Student grades and performance
- `lunch_accounts` - Lunch money management
- `lunch_transactions` - Transaction history
- `volunteer_opportunities` - Volunteer signup
- `volunteer_signups` - Volunteer tracking
- `school_fees` - Fee management
- `fee_payments` - Payment tracking
- `emergency_contacts` - Emergency contact info

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/parent-features-schema.sql
```

### 4. Teacher & Classroom Features (`teacher-classroom-schema.sql`)
Adds teacher and classroom management:
- `classrooms` - Classroom definitions
- `attendance_records` - Daily attendance
- `teacher_invitations` - Teacher onboarding
- `gradebook_entries` - Grade management
- `class_announcements` - Classroom announcements
- `class_resources` - Educational resources
- `seating_charts` - Classroom seating

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/teacher-classroom-schema.sql
```

## Alternative: Run Complete Migration

You can run all migrations at once using the full migration script:

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/full-migration.sql
```

## Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste each SQL file content in order
5. Run each script sequentially

## Post-Migration Verification

After running migrations, verify the setup:

### Check Tables Created
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected tables (26 total):
- activities
- academic_records
- attendance_records
- class_announcements
- class_resources
- classrooms
- districts
- emergency_contacts
- event_attendees
- event_checkins
- events
- fee_payments
- gradebook_entries
- lunch_accounts
- lunch_transactions
- notifications
- parent_communications
- profile_views
- profiles
- school_fees
- schools
- seating_charts
- students
- teacher_invitations
- user_preferences
- volunteer_opportunities
- volunteer_signups

### Verify RLS Policies
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Indexes
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Initial Data Setup

### 1. Create Districts and Schools
```sql
-- Insert sample district
INSERT INTO districts (name, state, contact_email) VALUES
('Unified School District', 'CA', 'admin@usd.edu');

-- Insert sample schools
INSERT INTO schools (district_id, name, address, phone, principal_name) 
SELECT 
  d.id,
  'Lincoln Elementary',
  '123 Education Blvd',
  '555-0100',
  'Dr. Sarah Johnson'
FROM districts d
WHERE d.name = 'Unified School District';
```

### 2. Create Admin User
```sql
-- After user signs up via Auth, update their profile
UPDATE profiles 
SET 
  role = 'school_admin',
  school_id = (SELECT id FROM schools WHERE name = 'Lincoln Elementary')
WHERE email = 'admin@school.edu';
```

### 3. Create Sample Classrooms
```sql
-- Create classrooms for each grade
INSERT INTO classrooms (school_id, name, grade_level, room_number)
SELECT 
  s.id,
  'Grade ' || grade_num || ' - Class A',
  grade_num::TEXT,
  (100 + grade_num)::TEXT
FROM schools s
CROSS JOIN generate_series(1, 6) AS grade_num
WHERE s.name = 'Lincoln Elementary';
```

## Troubleshooting

### Foreign Key Errors
If you get foreign key constraint errors, ensure you're running scripts in the correct order.

### Permission Errors
Make sure your database user has CREATE TABLE permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE postgres TO your_user;
```

### RLS Policy Issues
If RLS policies prevent access, temporarily disable during setup:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Run your inserts
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## Environment Variables

Ensure your `.env` file contains:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Next Steps

1. Run the application locally:
   ```bash
   npm install
   npm run dev
   ```

2. Create test users for each role:
   - Parent: parent@test.com
   - Teacher: teacher@test.com
   - School Admin: admin@test.com

3. Assign roles via SQL or Supabase dashboard

4. Test each user flow to ensure proper access control

## Backup & Restore

### Create Backup
```bash
pg_dump -h your-db-host -U postgres -d postgres > backup.sql
```

### Restore from Backup
```bash
psql -h your-db-host -U postgres -d postgres < backup.sql
```

## Performance Monitoring

Monitor slow queries in Supabase dashboard under:
- Database → Query Performance
- Database → Index Advisor

Add indexes as needed based on query patterns.