-- Pan-Africa Bitcoin Academy Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cohorts table (created first to avoid circular reference)
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT, -- Upcoming, Active, Completed
  sessions INTEGER DEFAULT 0,
  level TEXT, -- Beginner, Intermediate, Advanced
  seats_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (for authentication and user profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT UNIQUE, -- Format: "1/1/2025" (cohort/roll/year)
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country TEXT,
  city TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'New', -- New, Active, Graduated, etc.
  password_hash TEXT, -- Bcrypt hashed password for authentication
  reset_token TEXT, -- Secure token for password reset
  reset_token_expiry TIMESTAMP WITH TIME ZONE, -- Expiration for reset token
  cohort_id UUID REFERENCES cohorts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cohort enrollment (many-to-many relationship)
CREATE TABLE IF NOT EXISTS cohort_enrollment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cohort_id, student_id)
);

-- Students table (extends profiles with academic data)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0,
  assignments_completed INTEGER DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  live_sessions_attended INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT, -- live-class, assignment, community, workshop, deadline, quiz, cohort
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  description TEXT,
  link TEXT,
  recording_url TEXT,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL, -- If NULL, event is for everyone. If set, event is only for this specific cohort.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sats rewards table
CREATE TABLE IF NOT EXISTS sats_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_paid INTEGER DEFAULT 0, -- Amount in sats
  amount_pending INTEGER DEFAULT 0, -- Amount in sats
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_name TEXT,
  points INTEGER DEFAULT 0,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer resources table
CREATE TABLE IF NOT EXISTS developer_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT,
  category TEXT,
  level TEXT, -- Beginner, Intermediate, Advanced
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Developer events table
CREATE TABLE IF NOT EXISTS developer_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  link TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table (for student applications)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  city TEXT,
  experience_level TEXT,
  preferred_cohort_id UUID REFERENCES cohorts(id),
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_cohort_enrollment_cohort ON cohort_enrollment(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_enrollment_student ON cohort_enrollment(student_id);
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_cohort_id ON events(cohort_id);
CREATE INDEX IF NOT EXISTS idx_sats_rewards_student ON sats_rewards(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sats_rewards_updated_at BEFORE UPDATE ON sats_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sats_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow read access to all, adjust as needed)
CREATE POLICY "Allow public read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON cohorts FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON cohort_enrollment FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sats_rewards FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON achievements FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON developer_resources FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON developer_events FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON applications FOR SELECT USING (true);

-- Allow inserts for applications and profiles (registration)
CREATE POLICY "Allow public insert on applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Allow updates on profiles (for profile editing)
CREATE POLICY "Allow public update on profiles" ON profiles FOR UPDATE USING (true) WITH CHECK (true);

