-- Safe Production Database Migration
-- This migration checks for existing tables and creates them if they don't exist

-- =====================================================
-- STEP 1: Check and create base tables if they don't exist
-- =====================================================

-- Create profiles table if it doesn't exist (this should already exist from auth)
CREATE TABLE IF NOT EXISTS profiles (
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

-- Create schools table if it doesn't exist
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table if it doesn't exist
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  grade_level TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_school_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_school_id_fkey 
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Add missing columns to existing tables
-- =====================================================

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

-- Add foreign key for parent_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_parent_id_fkey' 
    AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add missing columns to schools table
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- =====================================================
-- STEP 3: Create parent feature tables
-- =====================================================

-- Parent Communications table
CREATE TABLE IF NOT EXISTS parent_communications (
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

-- Add foreign key constraints to parent_communications after table creation
DO $$ 
BEGIN
  -- Add parent_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parent_communications_parent_id_fkey' 
    AND table_name = 'parent_communications'
  ) THEN
    ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  -- Add sender_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parent_communications_sender_id_fkey' 
    AND table_name = 'parent_communications'
  ) THEN
    ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  
  -- Add school_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parent_communications_school_id_fkey' 
    AND table_name = 'parent_communications'
  ) THEN
    ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_school_id_fkey 
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
  END IF;
  
  -- Add student_id foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'parent_communications_student_id_fkey' 
    AND table_name = 'parent_communications'
  ) THEN
    ALTER TABLE parent_communications ADD CONSTRAINT parent_communications_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Lunch Accounts table
CREATE TABLE IF NOT EXISTS lunch_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  daily_limit DECIMAL(10,2) DEFAULT 20.00,
  weekly_limit DECIMAL(10,2) DEFAULT 100.00,
  auto_reload BOOLEAN DEFAULT false,
  auto_reload_amount DECIMAL(10,2) DEFAULT 50.00,
  auto_reload_threshold DECIMAL(10,2) DEFAULT 10.00,
  parent_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint and foreign key to lunch_accounts
DO $$ 
BEGIN
  -- Add unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lunch_accounts_student_id_key' 
    AND table_name = 'lunch_accounts'
  ) THEN
    ALTER TABLE lunch_accounts ADD CONSTRAINT lunch_accounts_student_id_key UNIQUE(student_id);
  END IF;
  
  -- Add foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lunch_accounts_student_id_fkey' 
    AND table_name = 'lunch_accounts'
  ) THEN
    ALTER TABLE lunch_accounts ADD CONSTRAINT lunch_accounts_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Lunch Transactions table
CREATE TABLE IF NOT EXISTS lunch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'deposit', 'refund', 'adjustment')),
  description TEXT,
  location TEXT,
  staff_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign keys to lunch_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lunch_transactions_account_id_fkey' 
    AND table_name = 'lunch_transactions'
  ) THEN
    ALTER TABLE lunch_transactions ADD CONSTRAINT lunch_transactions_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES lunch_accounts(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lunch_transactions_staff_id_fkey' 
    AND table_name = 'lunch_transactions'
  ) THEN
    ALTER TABLE lunch_transactions ADD CONSTRAINT lunch_transactions_staff_id_fkey 
    FOREIGN KEY (staff_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Academic Records table
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject TEXT NOT NULL,
  grade_value TEXT,
  grade_points DECIMAL(3,2),
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  teacher_id UUID,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign keys to academic_records
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'academic_records_student_id_fkey' 
    AND table_name = 'academic_records'
  ) THEN
    ALTER TABLE academic_records ADD CONSTRAINT academic_records_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'academic_records_teacher_id_fkey' 
    AND table_name = 'academic_records'
  ) THEN
    ALTER TABLE academic_records ADD CONSTRAINT academic_records_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Attendance Records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused')),
  reason TEXT,
  recorded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints to attendance_records
DO $$ 
BEGIN
  -- Add unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_records_student_id_date_key' 
    AND table_name = 'attendance_records'
  ) THEN
    ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_student_id_date_key UNIQUE(student_id, date);
  END IF;
  
  -- Add foreign keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_records_student_id_fkey' 
    AND table_name = 'attendance_records'
  ) THEN
    ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'attendance_records_recorded_by_fkey' 
    AND table_name = 'attendance_records'
  ) THEN
    ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_recorded_by_fkey 
    FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Create indexes for better performance
-- =====================================================

-- Parent Communications indexes
CREATE INDEX IF NOT EXISTS idx_parent_communications_parent_id ON parent_communications(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_communications_school_id ON parent_communications(school_id);
CREATE INDEX IF NOT EXISTS idx_parent_communications_student_id ON parent_communications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_communications_priority ON parent_communications(priority);
CREATE INDEX IF NOT EXISTS idx_parent_communications_read_at ON parent_communications(read_at);

-- Lunch Accounts indexes
CREATE INDEX IF NOT EXISTS idx_lunch_accounts_student_id ON lunch_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_lunch_transactions_account_id ON lunch_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_lunch_transactions_created_at ON lunch_transactions(created_at);

-- Academic Records indexes
CREATE INDEX IF NOT EXISTS idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_semester ON academic_records(semester, academic_year);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);

-- =====================================================
-- STEP 5: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE parent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: Create RLS Policies
-- =====================================================

-- Parent Communications RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'parent_communications' 
    AND policyname = 'Parents can view their own communications'
  ) THEN
    CREATE POLICY "Parents can view their own communications" ON parent_communications
      FOR SELECT USING (
        parent_id = auth.uid() OR
        student_id IN (
          SELECT s.id FROM students s WHERE s.parent_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'parent_communications' 
    AND policyname = 'School staff can manage communications'
  ) THEN
    CREATE POLICY "School staff can manage communications" ON parent_communications
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('teacher', 'school_admin', 'district_admin')
        )
      );
  END IF;
END $$;

-- Lunch Accounts RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lunch_accounts' 
    AND policyname = 'Parents can view lunch accounts for their children'
  ) THEN
    CREATE POLICY "Parents can view lunch accounts for their children" ON lunch_accounts
      FOR SELECT USING (
        student_id IN (
          SELECT s.id FROM students s WHERE s.parent_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lunch_accounts' 
    AND policyname = 'Parents can update lunch accounts for their children'
  ) THEN
    CREATE POLICY "Parents can update lunch accounts for their children" ON lunch_accounts
      FOR UPDATE USING (
        student_id IN (
          SELECT s.id FROM students s WHERE s.parent_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Academic Records RLS Policies  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'academic_records' 
    AND policyname = 'Parents can view academic records for their children'
  ) THEN
    CREATE POLICY "Parents can view academic records for their children" ON academic_records
      FOR SELECT USING (
        student_id IN (
          SELECT s.id FROM students s WHERE s.parent_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'academic_records' 
    AND policyname = 'Teachers can manage academic records'
  ) THEN
    CREATE POLICY "Teachers can manage academic records" ON academic_records
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('teacher', 'school_admin', 'district_admin')
        )
      );
  END IF;
END $$;

-- =====================================================
-- STEP 7: Update existing data
-- =====================================================

-- Update students with sample first/last names if they're missing
UPDATE students 
SET 
  first_name = COALESCE(first_name, 
    (ARRAY['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Sophia', 'Elijah', 'Charlotte', 'William'])[floor(random() * 10 + 1)::int]
  ),
  last_name = COALESCE(last_name,
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'])[floor(random() * 10 + 1)::int]
  ),
  current_gpa = COALESCE(current_gpa, random() * 1.5 + 2.5), -- GPA between 2.5-4.0
  attendance_rate = COALESCE(attendance_rate, random() * 20 + 80) -- 80-100% attendance
WHERE first_name IS NULL OR last_name IS NULL OR current_gpa IS NULL OR attendance_rate IS NULL;

-- Update schools with sample data if missing
UPDATE schools 
SET 
  logo_url = COALESCE(logo_url, '/images/school-logo-placeholder.png'),
  website = COALESCE(website, 'https://www.' || LOWER(REPLACE(name, ' ', '')) || '.edu'),
  contact_email = COALESCE(contact_email, 'info@' || LOWER(REPLACE(name, ' ', '')) || '.edu'),
  contact_phone = COALESCE(contact_phone, '(555) ' || LPAD((random() * 900 + 100)::int::text, 3, '0') || '-' || LPAD((random() * 9000 + 1000)::int::text, 4, '0'))
WHERE logo_url IS NULL OR website IS NULL OR contact_email IS NULL OR contact_phone IS NULL;

-- =====================================================
-- STEP 8: Create sample data
-- =====================================================

-- Insert sample lunch accounts for existing students
INSERT INTO lunch_accounts (student_id, balance, daily_limit, weekly_limit)
SELECT 
  s.id,
  CASE 
    WHEN random() < 0.3 THEN random() * 5 + 1 -- 30% low balance (1-6)
    ELSE random() * 45 + 15 -- 70% normal balance (15-60)
  END as balance,
  20.00,
  100.00
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM lunch_accounts la WHERE la.student_id = s.id
)
ON CONFLICT (student_id) DO NOTHING;

-- Insert sample parent communications (only if we have valid data)
INSERT INTO parent_communications (
  parent_id, 
  sender_id, 
  school_id, 
  student_id, 
  subject, 
  message, 
  category, 
  priority,
  read_at
)
SELECT 
  s.parent_id,
  (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1) as sender_id,
  s.school_id,
  s.id as student_id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Field Trip Permission Required'
    WHEN 1 THEN 'Parent-Teacher Conference Scheduled'
    WHEN 2 THEN 'Volunteer Opportunity Available'
    ELSE 'School Event Announcement'
  END as subject,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Please sign and return the permission slip for the upcoming field trip to the science museum.'
    WHEN 1 THEN 'Your conference is scheduled for next Tuesday at 3:00 PM. Please confirm your attendance.'
    WHEN 2 THEN 'We need volunteers for the upcoming school carnival. Please let us know if you can help.'
    ELSE 'Join us for our annual spring concert on Friday at 7:00 PM in the school auditorium.'
  END as message,
  CASE (random() * 3)::int
    WHEN 0 THEN 'permission'
    WHEN 1 THEN 'academic'
    ELSE 'announcement'
  END as category,
  CASE 
    WHEN random() < 0.2 THEN 'urgent'
    WHEN random() < 0.5 THEN 'high'
    ELSE 'normal'
  END as priority,
  CASE 
    WHEN random() < 0.7 THEN NOW() - (random() * interval '7 days')
    ELSE NULL
  END as read_at
FROM students s
WHERE s.parent_id IS NOT NULL 
  AND s.school_id IS NOT NULL
LIMIT 20;