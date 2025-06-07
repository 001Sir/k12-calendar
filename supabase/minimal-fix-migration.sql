-- Minimal Production Database Fix
-- First check what exists, then fix only what's needed

-- =====================================================
-- STEP 1: Check what tables currently exist
-- =====================================================

-- List all tables in public schema
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking existing tables...';
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Table exists: %', rec.table_name;
    END LOOP;
END $$;

-- =====================================================
-- STEP 2: Check profiles table structure
-- =====================================================

DO $$ 
DECLARE
    rec RECORD;
    table_exists BOOLEAN := FALSE;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Profiles table exists, checking columns...';
        FOR rec IN 
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % (type: %)', rec.column_name, rec.data_type;
        END LOOP;
    ELSE
        RAISE NOTICE 'Profiles table does NOT exist!';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Create or fix profiles table
-- =====================================================

-- If profiles table doesn't exist or is missing id column, create it
DO $$ 
DECLARE
    table_exists BOOLEAN := FALSE;
    id_column_exists BOOLEAN := FALSE;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if id column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
        ) INTO id_column_exists;
        
        IF NOT id_column_exists THEN
            RAISE NOTICE 'Profiles table exists but missing id column - this is a problem!';
            -- We'll need to recreate the table properly
            DROP TABLE profiles CASCADE;
            table_exists := FALSE;
        END IF;
    END IF;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Creating profiles table...';
        CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE,
            full_name TEXT,
            role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'teacher', 'school_admin', 'district_admin')),
            phone TEXT,
            address TEXT,
            avatar_url TEXT,
            school_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Profiles table created successfully';
    ELSE
        RAISE NOTICE 'Profiles table already exists with id column';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Create schools table if needed
-- =====================================================

CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    district_id UUID,
    principal_name TEXT,
    school_type TEXT DEFAULT 'elementary',
    grade_levels TEXT[] DEFAULT '{}',
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 5: Create students table if needed and add missing columns
-- =====================================================

-- Create students table if it doesn't exist
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID,
    grade_level TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS medical_info TEXT,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
ADD COLUMN IF NOT EXISTS transportation TEXT,
ADD COLUMN IF NOT EXISTS current_gpa DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2);

-- =====================================================
-- STEP 6: Create parent_communications table (drop and recreate)
-- =====================================================

-- Drop the problematic table and recreate it
DROP TABLE IF EXISTS parent_communications CASCADE;

CREATE TABLE parent_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    sender_id UUID,
    school_id UUID,
    student_id UUID,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_at TIMESTAMPTZ,
    response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 7: Add foreign key constraints ONLY if referenced tables exist
-- =====================================================

DO $$ 
DECLARE
    profiles_exists BOOLEAN := FALSE;
    schools_exists BOOLEAN := FALSE;
    students_exists BOOLEAN := FALSE;
BEGIN
    -- Check if referenced tables exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') INTO profiles_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schools') INTO schools_exists;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') INTO students_exists;
    
    RAISE NOTICE 'Tables exist - profiles: %, schools: %, students: %', profiles_exists, schools_exists, students_exists;
    
    -- Only add foreign keys if the referenced tables exist
    IF profiles_exists AND schools_exists THEN
        -- Add foreign key constraint to profiles -> schools
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'profiles_school_id_fkey' AND table_name = 'profiles'
        ) THEN
            ALTER TABLE profiles ADD CONSTRAINT profiles_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added profiles -> schools foreign key';
        END IF;
    END IF;
    
    IF students_exists AND schools_exists THEN
        -- Add foreign key constraint to students -> schools
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'students_school_id_fkey' AND table_name = 'students'
        ) THEN
            ALTER TABLE students ADD CONSTRAINT students_school_id_fkey 
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added students -> schools foreign key';
        END IF;
    END IF;
    
    IF students_exists AND profiles_exists THEN
        -- Add foreign key constraint to students -> profiles (parent_id)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'students_parent_id_fkey' AND table_name = 'students'
        ) THEN
            ALTER TABLE students ADD CONSTRAINT students_parent_id_fkey 
            FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added students -> profiles foreign key';
        END IF;
    END IF;
    
    -- Add foreign key constraints to parent_communications
    IF profiles_exists THEN
        ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_parent_id_fkey 
        FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added parent_communications -> profiles foreign keys';
    END IF;
    
    IF schools_exists THEN
        ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_communications -> schools foreign key';
    END IF;
    
    IF students_exists THEN
        ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_communications -> students foreign key';
    END IF;
    
END $$;

-- =====================================================
-- STEP 8: Final verification
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'All tables should now exist with proper foreign key constraints';
    RAISE NOTICE 'Check the output above for any errors or missing tables';
END $$;