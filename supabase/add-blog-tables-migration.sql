-- Blog Submissions and Blog Posts Tables Migration
-- Run this in your Supabase SQL Editor
-- This script handles both creating new tables and adding missing columns to existing tables

-- Check if blog_submissions table exists and add missing columns
DO $$
BEGIN
  -- Add cohort_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_submissions' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE blog_submissions ADD COLUMN cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_blog_submissions_cohort_id ON blog_submissions(cohort_id);
  END IF;
END $$;

-- Create blog_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  cohort TEXT, -- Text field for "Other" or custom cohort names
  author_bio TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT, -- e.g., "Graduate, Cohort 1"
  author_country TEXT,
  author_bio TEXT,
  category TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_blog_of_month BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_blog_submissions_author ON blog_submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_email ON blog_submissions(author_email);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status ON blog_submissions(status);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_created ON blog_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_cohort_id ON blog_submissions(cohort_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Trigger function for updated_at (create if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop first to avoid errors if they exist)
DROP TRIGGER IF EXISTS update_blog_submissions_updated_at ON blog_submissions;
CREATE TRIGGER update_blog_submissions_updated_at
  BEFORE UPDATE ON blog_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE blog_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Allow public read access to published posts" ON blog_posts;
CREATE POLICY "Allow public read access to published posts" ON blog_posts 
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Allow public insert on blog submissions" ON blog_submissions;
CREATE POLICY "Allow public insert on blog submissions" ON blog_submissions 
  FOR INSERT WITH CHECK (true);

