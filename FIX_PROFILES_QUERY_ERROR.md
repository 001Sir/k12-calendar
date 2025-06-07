# Fix for Profiles Query 400 Error

## Problem
The application was getting a 400 error when querying the profiles table:
```
profiles?select=*&user_id=eq.dc722872-a550-4223-b747-ac484cfe0de6
```

## Root Cause
There's a schema inconsistency between different database versions:
- **Original schema** (`schema.sql`): Uses `user_id` as the primary key column
- **Production schema** (`safe-production-migration.sql`): Uses `id` as the primary key column

## Solution Implemented

### 1. Database Migration Script
Created `/supabase/fix-profiles-column.sql` that:
- Checks which column exists in the profiles table
- Renames `id` to `user_id` if needed
- Updates all foreign key constraints
- Updates views and RLS policies

To apply this fix in production:
```bash
# Run this migration in your Supabase SQL editor
psql -h your-database-url -U postgres -d postgres -f supabase/fix-profiles-column.sql
```

### 2. JavaScript Code Updates
Updated the application code to handle both column names gracefully:

#### a. Created utility functions (`src/utils/profileQueries.js`):
- `queryProfiles()` - Queries with backward compatibility
- `queryProfilesByIds()` - Batch queries with compatibility
- `getProfileIdColumn()` - Detects which column to use

#### b. Updated `src/store/authStore.js`:
- Modified `initialize()` to try both column names
- Updated `updateProfile()` to use the correct column

#### c. Updated `src/hooks/useSchool.js`:
- Modified profile queries to handle both schemas

#### d. Updated `src/hooks/useActivities.js`:
- Replaced all profile queries with the new utility functions

## Testing
After applying these changes:
1. The application will work with both database schemas
2. No more 400 errors when querying profiles
3. Seamless transition between development and production

## Recommendation
For consistency, it's recommended to:
1. Run the database migration to standardize on `user_id` column
2. This aligns with Supabase's auth.users table foreign key reference
3. Maintains compatibility with the original schema design