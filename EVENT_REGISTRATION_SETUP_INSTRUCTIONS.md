# Event Registration System - Setup Instructions

## ⚠️ Important: Run SQL Files, Not Markdown Files!

The markdown files (`EVENT_REGISTRATION_EXECUTION_PLAN.md` and `EVENT_REGISTRATION_QUICK_REFERENCE.md`) are **documentation only**. Do NOT run them in SQL Editor.

## Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Migration Files (In Order)

Run these SQL files **one at a time** in the Supabase SQL Editor:

#### 2.1: Add Registration Fields to Events Table

**File to run**: `supabase/add-event-registration-fields.sql`

1. Open the file `supabase/add-event-registration-fields.sql`
2. Copy **ALL** the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Verify success - you should see a table showing the new columns

#### 2.2: Create Registrations Table

**File to run**: `supabase/create-event-registrations-table.sql`

1. Open the file `supabase/create-event-registrations-table.sql`
2. Copy **ALL** the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Verify success - you should see a table showing the new table structure

#### 2.3: Enable Registration on Existing Events

**Skip the seed file** - you already have events!

Instead, use the helper file: `supabase/enable-registration-on-existing-events.sql`

1. Open the file `supabase/enable-registration-on-existing-events.sql`
2. Find the example that matches your needs (single event, by type, etc.)
3. Replace `YOUR_EVENT_ID_HERE` with your actual event UUID
4. Run the query
5. Verify your events now have `is_registration_enabled = true`

**Note**: The seed file (`supabase/seed-test-events.sql`) is only if you want test data. Since you have existing events, you can skip it.

### Step 3: Verify Setup

Run this query to verify everything was created correctly:

```sql
-- Check events table has new columns
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'events' 
  AND column_name IN ('is_registration_enabled', 'location', 'event_date', 'form_config', 'max_registrations', 'registration_deadline')
ORDER BY column_name;

-- Check registrations table exists
SELECT table_name 
FROM information_schema.tables
WHERE table_name = 'event_registrations';

-- Check constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'events' 
  AND constraint_name = 'check_registration_no_cohort';

-- Check test events (if you ran seed file)
SELECT id, name, cohort_id, is_registration_enabled, location
FROM events
WHERE is_registration_enabled = true;
```

## Expected Results

After running all migrations:

✅ **Events table** should have 6 new columns:
- `is_registration_enabled`
- `location`
- `event_date`
- `form_config`
- `max_registrations`
- `registration_deadline`

✅ **event_registrations table** should exist with:
- `id` (UUID, primary key)
- `event_id` (UUID, foreign key)
- `full_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `additional_data` (JSONB)
- `created_at` (TIMESTAMP)

✅ **Constraint** `check_registration_no_cohort` should exist

✅ **3 test events** (if you ran seed file) with `cohort_id = NULL` and `is_registration_enabled = true`

## Troubleshooting

### Error: "relation events does not exist"
- Make sure you've run the base schema first (`supabase/schema.sql`)

### Error: "constraint already exists"
- The constraint check uses `IF NOT EXISTS`, so this shouldn't happen
- If it does, you can drop it first: `ALTER TABLE events DROP CONSTRAINT IF EXISTS check_registration_no_cohort;`

### Error: "column already exists"
- The migrations use `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen
- If columns already exist, you can skip that migration

### Error: "syntax error at or near '#'"
- You're trying to run a markdown file (`.md`) instead of a SQL file (`.sql`)
- Make sure you're opening files from the `supabase/` folder, not the root folder

## Next Steps

After completing the database setup:

1. ✅ Phase 1: Database Setup (You just completed this!)
2. ⏭️ Phase 2: Backend API (Create registration endpoint)
3. ⏭️ Phase 3: Frontend Form (Create registration form component)
4. ⏭️ Phase 4: Event Pages (Create event list and detail pages)
5. ⏭️ Phase 5: Optional Enhancements (Email, admin view, CSV export)

See `EVENT_REGISTRATION_EXECUTION_PLAN.md` for detailed implementation steps.

