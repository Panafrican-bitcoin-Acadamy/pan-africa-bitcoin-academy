# Step-by-Step Database Update Guide

## Overview
This guide will walk you through updating your Supabase database to add the chapter locking system.

## Prerequisites
- Access to your Supabase project dashboard
- Admin access to run SQL queries

---

## Step 1: Open Supabase SQL Editor

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in if needed

2. **Select Your Project**
   - Click on your project: `pan-africa-bitcoin-academy` (or your project name)

3. **Navigate to SQL Editor**
   - In the left sidebar, click on **"SQL Editor"**
   - Or go directly to: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql`

---

## Step 2: Create a New Query

1. **Click "New Query"** button (top right)
   - This opens a new SQL editor tab

2. **Name Your Query** (optional but recommended)
   - Click on "Untitled query" at the top
   - Rename it to: `Add Chapter Progress Table`

---

## Step 3: Copy the SQL Migration

1. **Open the migration file**
   - Open: `supabase/add-chapter-progress-table.sql` in your project

2. **Copy the entire contents** of the file

Here's what you should copy:

```sql
-- Chapter Progress Tracking Table
-- This table tracks which chapters students have completed/unlocked

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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chapter_progress_student ON chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter ON chapter_progress(chapter_number);

-- Function to automatically unlock Chapter 1 for new enrolled students
CREATE OR REPLACE FUNCTION unlock_chapter_one_for_student()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- When a student record is created, unlock Chapter 1
  INSERT INTO chapter_progress (student_id, chapter_number, chapter_slug, is_unlocked, unlocked_at)
  VALUES (NEW.profile_id, 1, 'the-nature-of-money', TRUE, NOW())
  ON CONFLICT (student_id, chapter_number) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-unlock Chapter 1 when student is created
DROP TRIGGER IF EXISTS trigger_unlock_chapter_one ON students;
CREATE TRIGGER trigger_unlock_chapter_one
  AFTER INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION unlock_chapter_one_for_student();
```

---

## Step 4: Paste and Run the SQL

1. **Paste the SQL** into the SQL Editor

2. **Review the SQL** (optional but recommended)
   - Make sure it looks correct
   - Check that all lines are pasted

3. **Run the Query**
   - Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - Wait for execution to complete

4. **Check for Success**
   - You should see: `Success. No rows returned` or similar success message
   - If there are errors, read the error message and fix any issues

---

## Step 5: Verify the Migration

### Option A: Using SQL Editor

1. **Run this verification query:**

```sql
-- Check if table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'chapter_progress'
ORDER BY ordinal_position;
```

**Expected Result:** You should see all columns of the `chapter_progress` table listed.

2. **Check if trigger was created:**

```sql
-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_unlock_chapter_one';
```

**Expected Result:** You should see the trigger details.

### Option B: Using Table Editor

1. **Go to Table Editor** in Supabase sidebar
2. **Look for `chapter_progress` table** in the list
3. **Click on it** to see the table structure
4. **Verify columns:**
   - `id` (UUID)
   - `student_id` (UUID)
   - `chapter_number` (Integer)
   - `chapter_slug` (Text)
   - `is_completed` (Boolean)
   - `is_unlocked` (Boolean)
   - `completed_at` (Timestamp)
   - `unlocked_at` (Timestamp)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

---

## Step 6: Unlock Chapter 1 for Existing Students (Optional)

If you already have enrolled students, you may want to unlock Chapter 1 for them:

```sql
-- Unlock Chapter 1 for all existing enrolled students
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

**Run this query** to unlock Chapter 1 for students who were enrolled before the migration.

---

## Step 7: Test the System

1. **Test with a registered student:**
   - Log in as an enrolled student
   - Go to `/chapters`
   - Verify Chapter 1 shows as "🔓 Unlocked"
   - Click on Chapter 1 - should open successfully
   - Other chapters should show "🔒 Locked"

2. **Test with unregistered user:**
   - Log out
   - Try to access any chapter directly
   - Should redirect to `/apply` page

3. **Test completion tracking:**
   - As enrolled student, view Chapter 1
   - Wait 30 seconds (or check database)
   - Chapter 1 should be marked as completed
   - Chapter 2 should automatically unlock

---

## Troubleshooting

### Error: "relation already exists"
- **Solution:** The table already exists. This is fine - the `CREATE TABLE IF NOT EXISTS` will skip creation.

### Error: "function already exists"
- **Solution:** The function already exists. This is fine - `CREATE OR REPLACE FUNCTION` will update it.

### Error: "permission denied"
- **Solution:** Make sure you're using the SQL Editor (which has admin privileges), not a restricted user.

### Error: "column does not exist"
- **Solution:** Make sure you ran the migration in the correct database/project.

### No data showing for existing students
- **Solution:** Run Step 6 to unlock Chapter 1 for existing students.

---

## Verification Checklist

- [ ] `chapter_progress` table created
- [ ] All columns present and correct
- [ ] Indexes created (`idx_chapter_progress_student`, `idx_chapter_progress_chapter`)
- [ ] Function `unlock_chapter_one_for_student()` created
- [ ] Trigger `trigger_unlock_chapter_one` created
- [ ] Existing students have Chapter 1 unlocked (if you ran Step 6)
- [ ] Can access chapters as enrolled student
- [ ] Unregistered users are redirected to apply page

---

## What This Migration Does

1. **Creates `chapter_progress` table:**
   - Tracks which chapters each student has unlocked/completed
   - Links to `profiles` table via `student_id`

2. **Creates indexes:**
   - Speeds up queries when checking chapter status

3. **Creates trigger function:**
   - Automatically unlocks Chapter 1 when a new student is enrolled
   - Runs whenever a record is inserted into `students` table

4. **Sets up progressive unlocking:**
   - Chapter 1 unlocked by default
   - Future chapters unlock when previous is completed

---

## Next Steps After Migration

1. **Test the chapter locking system**
2. **Verify redirects work correctly**
3. **Check that completion tracking works**
4. **Monitor for any errors in production**

---

## Need Help?

If you encounter any issues:
1. Check the error message in Supabase
2. Verify you're in the correct project
3. Make sure you have admin access
4. Check that all previous migrations have been run

---

**Migration Complete!** ✅

Your database is now ready for the chapter locking system.

