-- Fix Production Database Schema Issues
-- This migration addresses the specific errors encountered in production

-- =====================================================
-- STEP 1: Add missing columns to existing tables
-- =====================================================

-- Add missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS medical_info TEXT,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
ADD COLUMN IF NOT EXISTS transportation TEXT,
ADD COLUMN IF NOT EXISTS current_gpa DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2);

-- Add logo_url to schools table if missing
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS principal_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- =====================================================
-- STEP 2: Create missing tables for parent features
-- =====================================================

-- Parent Communications table
CREATE TABLE IF NOT EXISTS parent_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
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

-- Lunch Accounts table
CREATE TABLE IF NOT EXISTS lunch_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  daily_limit DECIMAL(10,2) DEFAULT 20.00,
  weekly_limit DECIMAL(10,2) DEFAULT 100.00,
  auto_reload BOOLEAN DEFAULT false,
  auto_reload_amount DECIMAL(10,2) DEFAULT 50.00,
  auto_reload_threshold DECIMAL(10,2) DEFAULT 10.00,
  parent_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Lunch Transactions table
CREATE TABLE IF NOT EXISTS lunch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES lunch_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'deposit', 'refund', 'adjustment')),
  description TEXT,
  location TEXT,
  staff_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Records table
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade_value TEXT,
  grade_points DECIMAL(3,2),
  semester TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused')),
  reason TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Student-Parent Relationships table
CREATE TABLE IF NOT EXISTS student_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian', 'emergency_contact')),
  is_primary BOOLEAN DEFAULT false,
  pickup_authorized BOOLEAN DEFAULT true,
  emergency_contact BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, parent_id)
);

-- =====================================================
-- STEP 3: Create indexes for better performance
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

-- Student-Parent relationships indexes
CREATE INDEX IF NOT EXISTS idx_student_parents_student_id ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent_id ON student_parents(parent_id);

-- =====================================================
-- STEP 4: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE parent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;

-- Parent Communications RLS Policies
CREATE POLICY "Parents can view their own communications" ON parent_communications
  FOR SELECT USING (
    parent_id = auth.uid() OR
    student_id IN (
      SELECT sp.student_id FROM student_parents sp WHERE sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "School staff can manage communications" ON parent_communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('teacher', 'school_admin', 'district_admin')
    )
  );

-- Lunch Accounts RLS Policies
CREATE POLICY "Parents can view lunch accounts for their children" ON lunch_accounts
  FOR SELECT USING (
    student_id IN (
      SELECT sp.student_id FROM student_parents sp WHERE sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update lunch accounts for their children" ON lunch_accounts
  FOR UPDATE USING (
    student_id IN (
      SELECT sp.student_id FROM student_parents sp WHERE sp.parent_id = auth.uid()
    )
  );

-- Academic Records RLS Policies  
CREATE POLICY "Parents can view academic records for their children" ON academic_records
  FOR SELECT USING (
    student_id IN (
      SELECT sp.student_id FROM student_parents sp WHERE sp.parent_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage academic records" ON academic_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('teacher', 'school_admin', 'district_admin')
    )
  );

-- Student-Parent relationships RLS
CREATE POLICY "Users can view their own relationships" ON student_parents
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "School admins can manage relationships" ON student_parents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('school_admin', 'district_admin')
    )
  );

-- =====================================================
-- STEP 5: Sample Data for Testing
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

-- Insert sample parent communications
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
  sp.parent_id,
  p.id as sender_id,
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
JOIN student_parents sp ON sp.student_id = s.id
JOIN profiles p ON p.role = 'teacher' AND random() < 0.3
LIMIT 50;

-- =====================================================
-- STEP 6: Update existing student records
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
-- STEP 7: Create helpful views
-- =====================================================

-- View for parent dashboard summary
CREATE OR REPLACE VIEW parent_dashboard_summary AS
SELECT 
  p.id as parent_id,
  COUNT(DISTINCT sp.student_id) as total_children,
  AVG(s.current_gpa) as average_gpa,
  AVG(s.attendance_rate) as average_attendance,
  SUM(la.balance) as total_lunch_balance,
  COUNT(CASE WHEN la.balance < 10 THEN 1 END) as low_balance_accounts,
  COUNT(CASE WHEN pc.read_at IS NULL THEN 1 END) as unread_communications
FROM profiles p
LEFT JOIN student_parents sp ON sp.parent_id = p.id
LEFT JOIN students s ON s.id = sp.student_id
LEFT JOIN lunch_accounts la ON la.student_id = s.id
LEFT JOIN parent_communications pc ON pc.parent_id = p.id
WHERE p.role = 'parent'
GROUP BY p.id;

COMMIT;