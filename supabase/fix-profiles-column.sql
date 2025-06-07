-- Fix profiles table column naming issue
-- This migration addresses the inconsistency between user_id and id columns

-- First, check if the profiles table has user_id column
DO $$
BEGIN
  -- Check if user_id column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    -- If user_id exists, we're using the original schema - do nothing
    RAISE NOTICE 'Profiles table already has user_id column. No changes needed.';
  ELSE
    -- If user_id doesn't exist, we need to rename id to user_id
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'id'
    ) THEN
      -- Rename id to user_id
      ALTER TABLE profiles RENAME COLUMN id TO user_id;
      RAISE NOTICE 'Renamed profiles.id to profiles.user_id';
    END IF;
  END IF;
END $$;

-- Ensure the constraint is properly named
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
    AND constraint_name = 'profiles_pkey'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_pkey;
  END IF;
  
  -- Add the primary key constraint with proper name
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
    AND constraint_name = 'profiles_user_id_pkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_pkey PRIMARY KEY (user_id);
  END IF;
END $$;

-- Update any foreign key references that might be using profiles(id)
-- First, update parent_communications if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'parent_communications' 
    AND column_name = 'parent_id'
  ) THEN
    -- Drop and recreate the constraint with the correct reference
    ALTER TABLE parent_communications 
      DROP CONSTRAINT IF EXISTS parent_communications_parent_id_fkey,
      ADD CONSTRAINT parent_communications_parent_id_fkey 
      FOREIGN KEY (parent_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
      
    ALTER TABLE parent_communications 
      DROP CONSTRAINT IF EXISTS parent_communications_sender_id_fkey,
      ADD CONSTRAINT parent_communications_sender_id_fkey 
      FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update student_parents if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'student_parents' 
    AND column_name = 'parent_id'
  ) THEN
    -- Drop and recreate the constraint with the correct reference
    ALTER TABLE student_parents 
      DROP CONSTRAINT IF EXISTS student_parents_parent_id_fkey,
      ADD CONSTRAINT student_parents_parent_id_fkey 
      FOREIGN KEY (parent_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update academic_records if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'academic_records' 
    AND column_name = 'teacher_id'
  ) THEN
    -- Drop and recreate the constraint with the correct reference
    ALTER TABLE academic_records 
      DROP CONSTRAINT IF EXISTS academic_records_teacher_id_fkey,
      ADD CONSTRAINT academic_records_teacher_id_fkey 
      FOREIGN KEY (teacher_id) REFERENCES profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update lunch_transactions if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'lunch_transactions' 
    AND column_name = 'staff_id'
  ) THEN
    -- Drop and recreate the constraint with the correct reference
    ALTER TABLE lunch_transactions 
      DROP CONSTRAINT IF EXISTS lunch_transactions_staff_id_fkey,
      ADD CONSTRAINT lunch_transactions_staff_id_fkey 
      FOREIGN KEY (staff_id) REFERENCES profiles(user_id);
  END IF;
END $$;

-- Update attendance_records if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'attendance_records' 
    AND column_name = 'recorded_by'
  ) THEN
    -- Drop and recreate the constraint with the correct reference
    ALTER TABLE attendance_records 
      DROP CONSTRAINT IF EXISTS attendance_records_recorded_by_fkey,
      ADD CONSTRAINT attendance_records_recorded_by_fkey 
      FOREIGN KEY (recorded_by) REFERENCES profiles(user_id);
  END IF;
END $$;

-- Update any views that might be using profiles.id
DROP VIEW IF EXISTS parent_dashboard_summary CASCADE;

-- Recreate the view with correct column reference
CREATE OR REPLACE VIEW parent_dashboard_summary AS
SELECT 
  p.user_id as parent_id,
  COUNT(DISTINCT sp.student_id) as total_children,
  AVG(s.current_gpa) as average_gpa,
  AVG(s.attendance_rate) as average_attendance,
  SUM(la.balance) as total_lunch_balance,
  COUNT(CASE WHEN la.balance < 10 THEN 1 END) as low_balance_accounts,
  COUNT(CASE WHEN pc.read_at IS NULL THEN 1 END) as unread_communications
FROM profiles p
LEFT JOIN student_parents sp ON sp.parent_id = p.user_id
LEFT JOIN students s ON s.id = sp.student_id
LEFT JOIN lunch_accounts la ON la.student_id = s.id
LEFT JOIN parent_communications pc ON pc.parent_id = p.user_id
WHERE p.role = 'parent'
GROUP BY p.user_id;

-- Update RLS policies to use user_id instead of id
DO $$
BEGIN
  -- Drop existing policies that might be using wrong column
  DROP POLICY IF EXISTS "Parents can view their own communications" ON parent_communications;
  DROP POLICY IF EXISTS "Users can view their own relationships" ON student_parents;
  
  -- Recreate policies with correct column reference
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_communications') THEN
    CREATE POLICY "Parents can view their own communications" ON parent_communications
      FOR SELECT USING (
        parent_id = auth.uid() OR
        student_id IN (
          SELECT sp.student_id FROM student_parents sp WHERE sp.parent_id = auth.uid()
        )
      );
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_parents') THEN
    CREATE POLICY "Users can view their own relationships" ON student_parents
      FOR SELECT USING (parent_id = auth.uid());
  END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'user_id'
  ) INTO col_exists;
  
  IF col_exists THEN
    RAISE NOTICE 'SUCCESS: profiles table now has user_id column';
  ELSE
    RAISE EXCEPTION 'ERROR: profiles table still missing user_id column';
  END IF;
END $$;