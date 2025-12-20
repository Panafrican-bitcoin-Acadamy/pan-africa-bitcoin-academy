# Cohort Sessions Implementation Guide

## Overview
This document explains how cohort sessions are implemented and displayed in the "Upcoming Cohorts" section of the apply page.

## Architecture Overview

### 1. Database Schema

**Table: `cohorts`**
- `id` (UUID) - Primary key
- `sessions` (INTEGER) - Total count of sessions for this cohort
- `start_date` (DATE) - Cohort start date
- `end_date` (DATE) - Cohort end date
- Other fields: name, level, seats_total, status, etc.

**Table: `cohort_sessions`**
- `id` (UUID) - Primary key
- `cohort_id` (UUID) - Foreign key to cohorts table
- `session_date` (DATE) - Date of the session
- `session_number` (INTEGER) - Sequential session number (1, 2, 3...)
- `topic` (TEXT) - Optional session topic
- `instructor` (TEXT) - Optional instructor name
- `duration_minutes` (INTEGER) - Default 90 minutes
- `link` (TEXT) - Optional meeting link
- `recording_url` (TEXT) - Optional recording URL
- `status` (TEXT) - scheduled, completed, cancelled, rescheduled
- Unique constraints: (cohort_id, session_date) and (cohort_id, session_number)

### 2. Session Generation Logic

**File: `src/lib/sessionGenerator.ts`**

The `generateCohortSessions()` function creates session dates based on:
- **Start Date**: First valid session day (skips Sunday if it falls on start date)
- **End Date**: Last valid session day
- **Frequency**: 3 sessions per week
- **Rule**: Always exclude Sundays
- **Pattern**: Sessions occur every 2 days (e.g., Friday → Monday → Wednesday)

**Algorithm:**
1. Start from cohort start date (move to Monday if Sunday)
2. Generate sessions every 2 days, skipping Sundays
3. Limit to 3 sessions per week (Monday-Saturday)
4. Continue until end date is reached
5. Each session gets an incremental `session_number`

**Example:**
- Start: Friday, Jan 5
- Sessions: Jan 5 (Fri), Jan 8 (Mon), Jan 10 (Wed), Jan 12 (Fri), Jan 15 (Mon)...

### 3. Automatic Session Creation

**File: `src/app/api/cohorts/route.ts` (POST endpoint)**

When an admin creates a new cohort with `start_date` and `end_date`:

1. **Cohort Creation** (lines 74-86):
   ```typescript
   const { data, error } = await supabaseAdmin
     .from('cohorts')
     .insert({ name, start_date, end_date, ... })
   ```

2. **Session Generation** (lines 99-135):
   - Validates dates using `validateCohortDates()`
   - Generates session dates using `generateCohortSessions()`
   - Inserts sessions into `cohort_sessions` table
   - Updates `cohorts.sessions` count

3. **Error Handling**: Session generation failures don't prevent cohort creation

### 4. Display in Apply Page

**File: `src/app/apply/page.tsx`**

#### Data Flow:

1. **Fetch Cohorts** (lines 290-342):
   ```typescript
   useEffect(() => {
     const fetchCohorts = async () => {
       const res = await fetch('/api/cohorts');
       const data = await res.json();
       // Transform and format cohort data
     };
     fetchCohorts();
   }, []);
   ```

2. **Cohort Interface** (lines 12-23):
   ```typescript
   interface Cohort {
     id: string;
     name: string;
     startDate: string;  // Formatted date string
     endDate: string;    // Formatted date string
     status: string;
     sessions: number;    // Total session count
     level: string;
     seats: number;
     available: number;
     enrolled: number;
   }
   ```

3. **Display in Carousel** (lines 560-566):
   ```typescript
   <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-zinc-900/50 p-2">
     <span className="text-xs text-zinc-400">Sessions</span>
     <span className="font-semibold text-cyan-400">
       {cohort.sessions}
     </span>
   </div>
   ```

#### What's Displayed:
- **Sessions Count**: Shows total number of sessions (`cohort.sessions`)
- **Location**: Inside each cohort card in the carousel
- **Format**: Simple number display (e.g., "24" sessions)

### 5. API Endpoints

#### GET `/api/cohorts`
**File: `src/app/api/cohorts/route.ts`**

Returns cohort data including:
- Basic cohort info (name, dates, level, status)
- **`sessions`**: Total count from `cohorts.sessions` column
- Enrollment counts (seats, available, enrolled)

**Response:**
```json
{
  "cohorts": [
    {
      "id": "uuid",
      "name": "Cohort 1",
      "startDate": "2024-01-15",
      "endDate": "2024-04-15",
      "sessions": 36,
      "level": "Beginner",
      "seats": 30,
      "available": 25,
      "enrolled": 5
    }
  ]
}
```

#### GET `/api/sessions`
**File: `src/app/api/sessions/route.ts`**

Fetches individual session records (used by Calendar component, not apply page):
- **Admin**: `?admin=true` - Returns all sessions from all cohorts
- **Student**: `?email=student@example.com` - Returns sessions for enrolled cohorts only

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "cohort_id": "uuid",
      "session_date": "2024-01-15",
      "session_number": 1,
      "topic": "Introduction to Bitcoin",
      "duration_minutes": 90,
      "status": "scheduled",
      "cohorts": {
        "name": "Cohort 1",
        "level": "Beginner"
      }
    }
  ]
}
```

### 6. Session Regeneration

**File: `src/app/api/cohorts/generate-sessions/route.ts`**

Admins can manually regenerate sessions for a cohort:
- Deletes existing sessions for the cohort
- Regenerates based on current start/end dates
- Updates session count in cohorts table

**Usage**: Called from admin panel "Regenerate Sessions" button

### 7. Calendar Integration

**File: `src/components/Calendar.tsx`**

Sessions are displayed in the calendar view:
- Fetches from `/api/sessions` endpoint
- Shows individual session dates
- Displays session number, topic, duration
- Allows export to iCal format

**Note**: Calendar shows detailed session information, while apply page only shows session count.

## Key Points

1. **Session Count Display**: The apply page shows only the **total count** of sessions, not individual session details
2. **Automatic Generation**: Sessions are automatically created when a cohort is created with start/end dates
3. **Session Rules**: 3 sessions per week, excluding Sundays, every 2 days apart
4. **Data Source**: Session count comes from `cohorts.sessions` column, which is updated during session generation
5. **Separation of Concerns**: 
   - Apply page: Shows session count (summary)
   - Calendar component: Shows individual session details (full list)

## Current Implementation Status

✅ **Working:**
- Automatic session generation on cohort creation
- Session count display in cohort cards
- Session regeneration for existing cohorts
- Calendar display of individual sessions

📝 **Note:**
- The apply page displays session **count** only
- Individual session details (dates, topics) are shown in the Calendar component
- Session generation happens server-side during cohort creation

## Files Involved

1. **Frontend Display:**
   - `src/app/apply/page.tsx` - Cohort carousel with session count

2. **Backend API:**
   - `src/app/api/cohorts/route.ts` - Cohort CRUD + session generation
   - `src/app/api/sessions/route.ts` - Session fetching for calendar

3. **Business Logic:**
   - `src/lib/sessionGenerator.ts` - Session date calculation algorithm

4. **Database:**
   - `supabase/add-cohort-sessions-table.sql` - Database schema

5. **Calendar Display:**
   - `src/components/Calendar.tsx` - Individual session display
