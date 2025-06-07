-- Teacher and Classroom Management Schema
-- Run this after the main schema.sql

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  room_number TEXT,
  capacity INTEGER DEFAULT 30,
  academic_year TEXT DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY'),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add classroom_id to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL;

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'excused')),
  notes TEXT,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher invitations
CREATE TABLE IF NOT EXISTS teacher_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invitation_token TEXT UNIQUE NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gradebook entries
CREATE TABLE IF NOT EXISTS gradebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  assignment_name TEXT NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('homework', 'quiz', 'test', 'project', 'participation')),
  points_earned DECIMAL,
  points_possible DECIMAL NOT NULL,
  percentage DECIMAL GENERATED ALWAYS AS (
    CASE 
      WHEN points_possible > 0 THEN (points_earned / points_possible * 100)
      ELSE 0
    END
  ) STORED,
  grade_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class announcements
CREATE TABLE IF NOT EXISTS class_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  pinned BOOLEAN DEFAULT FALSE,
  visible_from TIMESTAMPTZ DEFAULT NOW(),
  visible_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class resources
CREATE TABLE IF NOT EXISTS class_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'link', 'video', 'assignment', 'other')),
  resource_url TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  subject TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seating charts
CREATE TABLE IF NOT EXISTS seating_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout JSONB NOT NULL, -- Store seat positions and student assignments
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classrooms_school_id ON classrooms(school_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_classroom_id ON students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_classroom_date ON attendance_records(classroom_id, date);
CREATE INDEX IF NOT EXISTS idx_gradebook_student ON gradebook_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_gradebook_classroom ON gradebook_entries(classroom_id);
CREATE INDEX IF NOT EXISTS idx_announcements_classroom ON class_announcements(classroom_id);
CREATE INDEX IF NOT EXISTS idx_resources_classroom ON class_resources(classroom_id);

-- RLS Policies for classrooms
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage all classrooms in their school"
  ON classrooms
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE school_id = classrooms.school_id
      AND role IN ('school_admin', 'district_admin')
    )
  );

CREATE POLICY "Teachers can view their classroom"
  ON classrooms
  FOR SELECT
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their classroom"
  ON classrooms
  FOR UPDATE
  USING (teacher_id = auth.uid());

-- RLS Policies for attendance_records
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage attendance for their classroom"
  ON attendance_records
  FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view their children's attendance"
  ON attendance_records
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

-- RLS Policies for gradebook_entries
ALTER TABLE gradebook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage grades for their classroom"
  ON gradebook_entries
  FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view their children's grades"
  ON gradebook_entries
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own grades"
  ON gradebook_entries
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for class_announcements
ALTER TABLE class_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their announcements"
  ON class_announcements
  FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view announcements for their children's classes"
  ON class_announcements
  FOR SELECT
  USING (
    classroom_id IN (
      SELECT classroom_id FROM students WHERE parent_id = auth.uid()
    )
    AND (visible_until IS NULL OR visible_until > NOW())
  );

-- RLS Policies for class_resources
ALTER TABLE class_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their resources"
  ON class_resources
  FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Parents can view resources for their children's classes"
  ON class_resources
  FOR SELECT
  USING (
    classroom_id IN (
      SELECT classroom_id FROM students WHERE parent_id = auth.uid()
    )
  );

-- Function to calculate classroom statistics
CREATE OR REPLACE FUNCTION get_classroom_stats(p_classroom_id UUID)
RETURNS TABLE(
  total_students INTEGER,
  average_gpa DECIMAL,
  average_attendance DECIMAL,
  assignments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::INTEGER as total_students,
    AVG(ar.gpa)::DECIMAL as average_gpa,
    AVG(
      CASE 
        WHEN att.total > 0 THEN (att.present::DECIMAL / att.total * 100)
        ELSE 0
      END
    )::DECIMAL as average_attendance,
    COUNT(DISTINCT ge.id)::INTEGER as assignments_count
  FROM classrooms c
  LEFT JOIN students s ON s.classroom_id = c.id
  LEFT JOIN academic_records ar ON ar.student_id = s.id
  LEFT JOIN LATERAL (
    SELECT 
      student_id,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'present') as present
    FROM attendance_records
    WHERE student_id = s.id
    GROUP BY student_id
  ) att ON att.student_id = s.id
  LEFT JOIN gradebook_entries ge ON ge.classroom_id = c.id
  WHERE c.id = p_classroom_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update classroom updated_at
CREATE OR REPLACE FUNCTION update_classroom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classroom_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_classroom_updated_at();

-- Sample data for testing (optional)
-- INSERT INTO classrooms (school_id, name, grade_level, room_number)
-- SELECT 
--   s.id,
--   'Grade ' || g.grade || ' - Class ' || c.class,
--   g.grade::TEXT,
--   (100 + (g.grade::INTEGER * 10) + c.class)::TEXT
-- FROM schools s
-- CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6)) as g(grade)
-- CROSS JOIN (VALUES (1), (2)) as c(class)
-- WHERE s.name = 'Lincoln Elementary'
-- LIMIT 12;