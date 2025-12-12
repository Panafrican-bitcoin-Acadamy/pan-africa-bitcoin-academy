-- Attendance table for tracking student attendance at live lectures
-- Data imported from Google Meet CSV exports

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Email from Google Meet CSV (for matching during import)
  name TEXT, -- Name from Google Meet CSV
  join_time TIMESTAMP WITH TIME ZONE,
  leave_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Duration in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, event_id) -- One attendance record per student per event
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_email ON attendance(email);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Block all direct client access - only API endpoints can access
CREATE POLICY "API only - no direct client access" ON attendance
  FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE attendance IS 'Student attendance records from Google Meet live lectures';
COMMENT ON COLUMN attendance.email IS 'Email from Google Meet CSV - used to match with student profiles during import';


