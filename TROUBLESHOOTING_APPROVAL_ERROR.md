# Troubleshooting "Failed to create profile" Error

## Overview
When approving an application, if you get the error "Failed to create profile", this guide will help you identify and fix the issue.

## Common Causes & Solutions

### 1. **Email Already Exists (Error Code: 23505)**
**Symptom:** Error message mentions "email" or "unique constraint violation"

**Cause:** A profile with this email already exists in the database.

**Solution:**
- Check if the profile already exists in Supabase:
  ```sql
  SELECT * FROM profiles WHERE email = 'user@example.com';
  ```
- If it exists, the approval process will link to the existing profile automatically
- The improved code now handles this case better with double-checking

### 2. **Missing Required Fields (Error Code: 23502)**
**Symptom:** Error mentions "not null constraint violation" or "required field"

**Cause:** The application is missing required data (name or email).

**Solution:**
- Check the application data in Supabase:
  ```sql
  SELECT first_name, last_name, email FROM applications WHERE id = 'application-id';
  ```
- Ensure both `first_name` and `last_name` are present
- Ensure `email` is present and valid

### 3. **Invalid Cohort Reference (Error Code: 23503)**
**Symptom:** Error mentions "foreign key constraint violation"

**Cause:** The `preferred_cohort_id` in the application references a cohort that doesn't exist.

**Solution:**
- Check if the cohort exists:
  ```sql
  SELECT * FROM cohorts WHERE id = 'cohort-id';
  ```
- If the cohort doesn't exist, either:
  - Create the cohort first, OR
  - Update the application to remove the `preferred_cohort_id`:
    ```sql
    UPDATE applications 
    SET preferred_cohort_id = NULL 
    WHERE id = 'application-id';
    ```

### 4. **RLS Policy Issues**
**Symptom:** Error occurs but no specific constraint violation

**Cause:** Row Level Security policies might be blocking the insert (unlikely with supabaseAdmin, but possible).

**Solution:**
- Verify RLS policies allow inserts:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'profiles';
  ```
- Ensure there's a policy allowing inserts (should be: "Allow public insert on profiles")

### 5. **Database Connection Issues**
**Symptom:** Generic error, no specific code

**Cause:** Database connection or service role key issues.

**Solution:**
- Check Supabase service role key is correct in `.env.local`
- Verify Supabase project is active and accessible
- Check Supabase dashboard for any service issues

## Debugging Steps

### Step 1: Check the Error Details
The improved error message now shows:
- **Error Code:** PostgreSQL error code (23505, 23502, etc.)
- **Details:** Human-readable error message
- **Hint:** Database hint (if available)

### Step 2: Check Application Data
```sql
SELECT 
  id,
  first_name,
  last_name,
  email,
  preferred_cohort_id,
  status
FROM applications 
WHERE id = 'application-id';
```

### Step 3: Check if Profile Already Exists
```sql
SELECT 
  id,
  email,
  name,
  status
FROM profiles 
WHERE email = 'user@example.com';
```

### Step 4: Check Server Logs
Check your server console/logs for detailed error information:
- The code now logs the full error object
- It also logs the profile data being inserted
- Look for the "Error creating profile:" log entry

### Step 5: Verify Database Schema
Ensure the profiles table has the correct structure:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

Required columns:
- `id` (UUID, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `status` (TEXT, default 'New')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Quick Fix: Manual Profile Creation

If you need to manually create the profile and continue:

1. **Create the profile manually:**
   ```sql
   INSERT INTO profiles (name, email, phone, country, city, status)
   VALUES (
     'First Last',
     'user@example.com',
     '+1234567890',
     'Country',
     'City',
     'Pending Password Setup'
   )
   RETURNING id;
   ```

2. **Update the application to link to the profile:**
   ```sql
   UPDATE applications
   SET 
     status = 'Approved',
     profile_id = 'profile-uuid-from-step-1',
     approved_at = NOW()
   WHERE id = 'application-id';
   ```

3. **Create the student record:**
   ```sql
   INSERT INTO students (profile_id, name, email, status)
   VALUES (
     'profile-uuid',
     'First Last',
     'user@example.com',
     'Enrolled'
   );
   ```

4. **Enroll in cohort (if applicable):**
   ```sql
   INSERT INTO cohort_enrollment (cohort_id, student_id)
   VALUES ('cohort-id', 'profile-uuid');
   ```

## Prevention

To prevent this error:
1. ✅ Always validate application data before approval
2. ✅ Check for existing profiles before creating new ones (code now does this)
3. ✅ Verify cohort exists before linking
4. ✅ Ensure all required fields are present in the application

## Recent Improvements

The code has been improved to:
- ✅ Double-check for existing profiles (race condition protection)
- ✅ Provide detailed error messages with error codes
- ✅ Log full error details for debugging
- ✅ Handle common error cases gracefully
- ✅ Validate required fields before insert
