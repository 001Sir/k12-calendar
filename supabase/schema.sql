-- Create districts table first (no dependencies)
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schools table (depends on districts)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district_id UUID REFERENCES districts(id),
  address JSONB,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (depends on schools)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('parent', 'teacher', 'school_admin', 'district_admin')),
  school_id UUID REFERENCES schools(id),
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table (depends on schools and auth.users)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  capacity INTEGER,
  event_type TEXT,
  visibility TEXT DEFAULT 'public',
  requires_rsvp BOOLEAN DEFAULT false,
  requires_payment BOOLEAN DEFAULT false,
  price DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  check_in_time TIMESTAMPTZ,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  guests_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event_analytics table
CREATE TABLE IF NOT EXISTS event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0,
  rsvp_count INTEGER DEFAULT 0,
  attendance_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(event_id, date)
);

-- Enable Row Level Security
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_schools_district_id ON schools(district_id);
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_events_school_id ON events(school_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);

-- RLS Policies

-- Districts policies
CREATE POLICY "Districts viewable by authenticated users" ON districts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Districts manageable by district admins" ON districts
  FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'district_admin'
  ));

-- Schools policies
CREATE POLICY "Schools viewable by authenticated users" ON schools
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Schools manageable by school and district admins" ON schools
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND (
        profiles.role = 'district_admin' 
        OR (profiles.role = 'school_admin' AND profiles.school_id = schools.id)
      )
    )
  );

-- Profiles policies
CREATE POLICY "Profiles viewable by owner" ON profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Profiles editable by owner" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Profiles insertable on signup" ON profiles
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Public events viewable by all" ON events
  FOR SELECT TO authenticated 
  USING (visibility = 'public' OR created_by = auth.uid());

CREATE POLICY "Events manageable by creators and school admins" ON events
  FOR ALL TO authenticated 
  USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('school_admin', 'district_admin')
      AND (profiles.school_id = events.school_id OR profiles.role = 'district_admin')
    )
  );

-- Event attendees policies
CREATE POLICY "Attendees viewable by event participants and admins" ON event_attendees
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_attendees.event_id 
      AND events.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('school_admin', 'district_admin')
    )
  );

CREATE POLICY "Attendees can RSVP for themselves" ON event_attendees
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Attendees can update their own RSVP" ON event_attendees
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'parent'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_attendees_updated_at BEFORE UPDATE ON event_attendees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();