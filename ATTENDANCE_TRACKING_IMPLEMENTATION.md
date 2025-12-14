# Attendance Tracking Implementation

## Overview
This implementation adds attendance tracking for live lectures using Google Meet CSV exports. Attendance data is linked to students and displayed alongside chapter completion progress in the admin dashboard.

## Database Changes

### 1. Add `chapter_number` to Events Table
**File:** `supabase/add-chapter-number-to-events.sql`

Adds a `chapter_number` column to the `events` table to link live-class events to specific chapters.

**Run in Supabase SQL Editor:**
```sql
-- Copy contents of supabase/add-chapter-number-to-events.sql
```

### 2. Create Attendance Table
**File:** `supabase/create-attendance-table.sql`

Creates the `attendance` table to store student attendance records from Google Meet CSV exports.

**Run in Supabase SQL Editor:**
```sql
-- Copy contents of supabase/create-attendance-table.sql
```

## Features

### 1. CSV Upload for Attendance
- **Location:** Admin Dashboard → "Upload Attendance" section
- **Process:**
  1. Select a live-class event from the dropdown
  2. Upload a CSV file exported from Google Meet
  3. System matches students by email and creates attendance records

**CSV Format Expected:**
- Must include an `Email` column (required)
- Optional columns: `Name`, `Join Time`, `Leave Time`, `Duration`
- System automatically detects column names (case-insensitive)

### 2. Enhanced Student Progress View
- **Location:** Admin Dashboard → "Student Progress" table
- **Displays:**
  - **Chapters:** Completed chapters out of total (e.g., "15/20")
  - **Attendance:** Lectures attended out of total, with percentage (e.g., "8/10 (80%)")
  - **Overall Progress:** Combined percentage (50% chapters + 50% attendance)

### 3. Event Creation with Chapter Linking
- When creating a live-class event, admins can optionally specify a chapter number (1-20)
- This links the event to a specific chapter for better organization

## API Endpoints

### `POST /api/admin/attendance/upload`
Uploads Google Meet CSV attendance data.

**Request:**
- `FormData` with:
  - `file`: CSV file
  - `eventId`: UUID of the live-class event

**Response:**
```json
{
  "success": true,
  "event": { "id": "...", "name": "..." },
  "processed": 25,
  "matched": 23,
  "errors": [],
  "totalErrors": 0
}
```

### `GET /api/admin/events/live-classes`
Fetches all live-class events for CSV upload selection.

**Response:**
```json
{
  "events": [
    {
      "id": "...",
      "name": "Chapter 1 Live Session",
      "start_time": "2024-01-15T10:00:00Z",
      "chapter_number": 1,
      "cohort_id": "..."
    }
  ]
}
```

### `GET /api/admin/students/progress` (Enhanced)
Now includes attendance data in the response:

**Response:**
```json
{
  "progress": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "completedChapters": 15,
      "totalChapters": 20,
      "lecturesAttended": 8,
      "totalLiveLectures": 10,
      "attendancePercent": 80,
      "overallProgress": 77
    }
  ]
}
```

## How to Use

### Step 1: Run Database Migrations
1. Open Supabase SQL Editor
2. Run `supabase/add-chapter-number-to-events.sql`
3. Run `supabase/create-attendance-table.sql`

### Step 2: Create Live-Class Events
1. Go to Admin Dashboard
2. In "Create Event" form:
   - Set type to "Live Class"
   - Optionally set chapter number (1-20)
   - Fill in other event details
   - Create the event

### Step 3: Export Google Meet Attendance
1. After a live lecture, export attendance from Google Meet as CSV
2. CSV should include at minimum: Email column
3. Optional: Name, Join Time, Leave Time, Duration columns

### Step 4: Upload Attendance
1. Go to Admin Dashboard → "Upload Attendance" section
2. Select the corresponding live-class event
3. Upload the CSV file
4. System will:
   - Match students by email
   - Create attendance records
   - Show success/error summary

### Step 5: View Progress
- Check "Student Progress" table to see:
  - Chapter completion
  - Attendance percentage
  - Overall progress percentage

## Data Flow

1. **Event Creation:** Admin creates live-class event (optionally linked to chapter)
2. **CSV Export:** Google Meet attendance exported as CSV
3. **CSV Upload:** Admin uploads CSV via dashboard
4. **Email Matching:** System matches CSV emails to student profiles
5. **Attendance Records:** Records created in `attendance` table
6. **Progress Calculation:** 
   - Attendance % = (lectures attended / total live lectures) × 100
   - Overall % = (chapters completed / 20) × 50 + (attendance %) × 0.5

## Database Schema

### `attendance` Table
- `id` (UUID, primary key)
- `student_id` (UUID, references `profiles.id`)
- `event_id` (UUID, references `events.id`)
- `email` (TEXT, from CSV for matching)
- `name` (TEXT, from CSV)
- `join_time` (TIMESTAMP)
- `leave_time` (TIMESTAMP)
- `duration_minutes` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

### `events` Table (Updated)
- Added `chapter_number` (INTEGER, nullable)

## Security

- All attendance endpoints require admin authentication
- Attendance table has RLS enabled (API-only access)
- CSV upload validates event existence and student matching

## Notes

- Attendance matching is case-insensitive for emails
- Duplicate uploads for the same student+event are handled via upsert
- Attendance percentage is calculated based on total live-class events
- Overall progress is a weighted combination (50% chapters, 50% attendance)








