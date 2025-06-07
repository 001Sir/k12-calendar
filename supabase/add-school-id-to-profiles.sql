-- Add school_id column to profiles table if it doesn't exist
-- This migration handles the case where profiles table exists but lacks school_id column

-- Check if school_id column exists and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'school_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN school_id UUID;
    
    -- Add foreign key constraint if schools table exists
    IF EXISTS (
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'schools'
    ) THEN
      ALTER TABLE profiles 
      ADD CONSTRAINT profiles_school_id_fkey 
      FOREIGN KEY (school_id) 
      REFERENCES schools(id) 
      ON DELETE SET NULL;
    END IF;
    
    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);
    
    RAISE NOTICE 'Added school_id column to profiles table';
  ELSE
    RAISE NOTICE 'school_id column already exists in profiles table';
  END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE(school_id) ON profiles TO authenticated;