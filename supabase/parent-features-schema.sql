-- Parent Dashboard Enhancement Schema
-- This adds tables needed for the enhanced parent dashboard features

-- 1. Create students table (children of parents)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  full_name TEXT NOT NULL,
  grade_level TEXT,
  classroom TEXT,
  teacher_name TEXT,
  student_id TEXT, -- School-assigned ID
  birth_date DATE,
  avatar_url TEXT,
  medical_info JSONB DEFAULT '{}',
  emergency_contacts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create parent_communications table
CREATE TABLE IF NOT EXISTS parent_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id),
  student_id UUID REFERENCES students(id),
  school_id UUID REFERENCES schools(id),
  type TEXT CHECK (type IN ('announcement', 'message', 'permission_slip', 'form')),
  title TEXT NOT NULL,
  content TEXT,
  sender TEXT,
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMPTZ,
  response_status TEXT CHECK (response_status IN ('pending', 'completed', 'overdue')),
  response_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create academic_records table
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('assignment', 'grade', 'attendance', 'behavior')),
  subject TEXT,
  title TEXT,
  description TEXT,
  grade TEXT,
  points_earned DECIMAL(5,2),
  points_possible DECIMAL(5,2),
  date DATE,
  teacher_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create lunch_accounts table
CREATE TABLE IF NOT EXISTS lunch_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  auto_reload_enabled BOOLEAN DEFAULT false,
  auto_reload_amount DECIMAL(10,2),
  auto_reload_threshold DECIMAL(10,2),
  low_balance_threshold DECIMAL(10,2) DEFAULT 5.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create lunch_transactions table
CREATE TABLE IF NOT EXISTS lunch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES lunch_accounts(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('purchase', 'deposit', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 6. Create volunteer_opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ,
  duration_hours DECIMAL(4,2),
  location TEXT,
  slots_available INTEGER,
  slots_filled INTEGER DEFAULT 0,
  skills_needed TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create volunteer_signups table
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('signed_up', 'confirmed', 'completed', 'cancelled')),
  hours_completed DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, parent_id)
);

-- 8. Create parent_event_rsvps table (extends event_attendees for parent-specific features)
CREATE TABLE IF NOT EXISTS parent_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id),
  student_id UUID REFERENCES students(id),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'declined', 'waitlisted')),
  number_attending INTEGER DEFAULT 1,
  special_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, parent_id, student_id)
);

-- 9. Create school_fees table
CREATE TABLE IF NOT EXISTS school_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  student_id UUID REFERENCES students(id),
  fee_type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  is_authorized_pickup BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_parent_communications_parent_id ON parent_communications(parent_id);
CREATE INDEX idx_parent_communications_student_id ON parent_communications(student_id);
CREATE INDEX idx_parent_communications_response_status ON parent_communications(response_status);
CREATE INDEX idx_academic_records_student_id ON academic_records(student_id);
CREATE INDEX idx_academic_records_date ON academic_records(date DESC);
CREATE INDEX idx_lunch_accounts_student_id ON lunch_accounts(student_id);
CREATE INDEX idx_volunteer_opportunities_school_id ON volunteer_opportunities(school_id);
CREATE INDEX idx_volunteer_opportunities_date ON volunteer_opportunities(date);
CREATE INDEX idx_parent_event_rsvps_parent_id ON parent_event_rsvps(parent_id);
CREATE INDEX idx_school_fees_student_id ON school_fees(student_id);
CREATE INDEX idx_school_fees_status ON school_fees(status);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students: Parents can only see their own children
CREATE POLICY "Parents can view their own children" ON students
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can update their own children" ON students
  FOR UPDATE USING (parent_id = auth.uid());

-- Communications: Parents can see communications for their children
CREATE POLICY "Parents can view their communications" ON parent_communications
  FOR SELECT USING (parent_id = auth.uid());

-- Academic Records: Parents can view their children's records
CREATE POLICY "Parents can view children's academic records" ON academic_records
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- Lunch Accounts: Parents can view and manage their children's accounts
CREATE POLICY "Parents can view children's lunch accounts" ON lunch_accounts
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- Volunteer Opportunities: All authenticated users can view
CREATE POLICY "Authenticated users can view volunteer opportunities" ON volunteer_opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Volunteer Signups: Users can manage their own signups
CREATE POLICY "Parents can manage their volunteer signups" ON volunteer_signups
  FOR ALL USING (parent_id = auth.uid());

-- Parent Event RSVPs: Parents can manage their own RSVPs
CREATE POLICY "Parents can manage their event RSVPs" ON parent_event_rsvps
  FOR ALL USING (parent_id = auth.uid());

-- School Fees: Parents can view fees for their children
CREATE POLICY "Parents can view their children's fees" ON school_fees
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- Emergency Contacts: Parents can manage contacts for their children
CREATE POLICY "Parents can manage emergency contacts" ON emergency_contacts
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- Functions

-- Function to calculate total volunteer hours for a parent
CREATE OR REPLACE FUNCTION get_parent_volunteer_hours(p_parent_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(hours_completed) 
     FROM volunteer_signups 
     WHERE parent_id = p_parent_id 
     AND status = 'completed'),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get lunch account balance including pending transactions
CREATE OR REPLACE FUNCTION get_lunch_balance_with_pending(p_student_id UUID)
RETURNS TABLE(current_balance DECIMAL, pending_charges DECIMAL, available_balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.balance as current_balance,
    COALESCE(SUM(CASE WHEN lt.type = 'purchase' THEN lt.amount ELSE 0 END), 0) as pending_charges,
    la.balance - COALESCE(SUM(CASE WHEN lt.type = 'purchase' THEN lt.amount ELSE 0 END), 0) as available_balance
  FROM lunch_accounts la
  LEFT JOIN lunch_transactions lt ON la.id = lt.account_id 
    AND lt.transaction_date > NOW() - INTERVAL '1 day'
    AND lt.type = 'purchase'
  WHERE la.student_id = p_student_id
  GROUP BY la.balance;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Update student updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_timestamp
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_student_updated_at();

-- Update lunch account timestamp on transaction
CREATE OR REPLACE FUNCTION update_lunch_account_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lunch_accounts 
  SET 
    balance = CASE 
      WHEN NEW.type = 'deposit' THEN balance + NEW.amount
      WHEN NEW.type = 'purchase' THEN balance - NEW.amount
      WHEN NEW.type = 'refund' THEN balance + NEW.amount
    END,
    updated_at = NOW()
  WHERE id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lunch_balance
  AFTER INSERT ON lunch_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_lunch_account_on_transaction();

-- Update volunteer opportunity slots
CREATE OR REPLACE FUNCTION update_volunteer_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'signed_up' THEN
    UPDATE volunteer_opportunities 
    SET slots_filled = slots_filled + 1 
    WHERE id = NEW.opportunity_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'signed_up' AND NEW.status = 'cancelled' THEN
    UPDATE volunteer_opportunities 
    SET slots_filled = slots_filled - 1 
    WHERE id = NEW.opportunity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manage_volunteer_slots
  AFTER INSERT OR UPDATE ON volunteer_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_slots();