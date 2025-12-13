# Quick Database Update - Copy & Paste Guide

## 🚀 Quick Steps (5 minutes)

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"** button

### Step 2: Copy This SQL Code

Copy the entire code block below:

```sql
-- ============================================
-- CHAPTER PROGRESS TABLE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Create chapter_progress table
CREATE TABLE IF NOT EXISTS chapter_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  chapter_slug TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  is_unlocked BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, chapter_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_progress_student ON chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter ON chapter_progress(chapter_number);

-- Function to auto-unlock Chapter 1 for new students
CREATE OR REPLACE FUNCTION unlock_chapter_one_for_student()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO chapter_progress (student_id, chapter_number, chapter_slug, is_unlocked, unlocked_at)
  VALUES (NEW.profile_id, 1, 'the-nature-of-money', TRUE, NOW())
  ON CONFLICT (student_id, chapter_number) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to run function when student is created
DROP TRIGGER IF EXISTS trigger_unlock_chapter_one ON students;
CREATE TRIGGER trigger_unlock_chapter_one
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION unlock_chapter_one_for_student();
```

### Step 3: Paste and Run
1. **Paste** the SQL into the editor
2. Click **"Run"** button (or press `Ctrl+Enter`)
3. Wait for "Success" message

### Step 4: Unlock Chapter 1 for Existing Students (If you have any)

If you already have enrolled students, run this additional query:

```sql
-- Unlock Chapter 1 for existing enrolled students
INSERT INTO chapter_progress (student_id, chapter_number, chapter_slug, is_unlocked, unlocked_at)
SELECT 
  s.profile_id,
  1,
  'the-nature-of-money',
  TRUE,
  NOW()
FROM students s
WHERE NOT EXISTS (
  SELECT 1 
  FROM chapter_progress cp 
  WHERE cp.student_id = s.profile_id 
  AND cp.chapter_number = 1
);
```

### Step 5: Verify It Worked

Run this check query:

```sql
-- Verify table was created
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'chapter_progress';
```

**Expected result:** Should return `1`

---

## ✅ Done!

Your database is now updated. Test by:
1. Logging in as a student
2. Going to `/chapters`
3. Chapter 1 should be unlocked 🔓

---

## 📋 What Each Part Does

| Part | What It Does |
|------|--------------|
| `CREATE TABLE chapter_progress` | Creates table to track chapter progress |
| `CREATE INDEX` | Makes queries faster |
| `CREATE FUNCTION` | Function to unlock Chapter 1 |
| `CREATE TRIGGER` | Auto-runs when student is enrolled |

---

## ⚠️ Troubleshooting

**Error: "already exists"** → That's fine, it means it's already created

**Error: "permission denied"** → Make sure you're in SQL Editor (has admin access)

**No errors** → Perfect! Migration successful ✅




