-- Mentorship applications table
CREATE TABLE IF NOT EXISTS mentorship_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  whatsapp TEXT,
  role TEXT,
  experience TEXT,
  teaching_experience TEXT,
  motivation TEXT,
  hours TEXT,
  comments TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentorship_email ON mentorship_applications(email);
CREATE INDEX IF NOT EXISTS idx_mentorship_status ON mentorship_applications(status);

COMMENT ON TABLE mentorship_applications IS 'Mentorship/volunteer applications';

