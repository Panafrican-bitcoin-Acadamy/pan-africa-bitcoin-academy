# Session Handling: Database to UI Flow

This document explains how cohort sessions are stored in the database, generated, fetched via API, and displayed in the UI.

## 📊 Database Schema

### Table: `cohort_sessions`

The sessions are stored in the `cohort_sessions` table with the following structure:

```sql
CREATE TABLE cohort_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL,
  topic TEXT,
  instructor TEXT,
  duration_minutes INTEGER DEFAULT 90,
  link TEXT,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cohort_id, session_date),
  UNIQUE(cohort_id, session_number)
);
```

**Key Constraints:**
- `UNIQUE(cohort_id, session_date)` - Prevents duplicate sessions on the same date for a cohort
- `UNIQUE(cohort_id, session_number)` - Ensures sequential session numbers are unique per cohort
- Foreign key to `cohorts` table with CASCADE delete

**Indexes:**
- `idx_cohort_sessions_cohort_id` - Fast lookup by cohort
- `idx_cohort_sessions_session_date` - Fast lookup by date
- `idx_cohort_sessions_cohort_date` - Composite index for common queries

## 🔄 Session Generation Flow

### 1. **Automatic Generation on Cohort Creation**

**File:** `src/app/api/cohorts/route.ts` (POST endpoint)

When a cohort is created with `start_date` and `end_date`:

```typescript
// 1. Validate dates
const validation = validateCohortDates(start_date, end_date);

// 2. Generate session dates using the algorithm
const sessionDates = generateCohortSessions(
  new Date(start_date),
  new Date(end_date)
);

// 3. Insert sessions into database
const sessionsToInsert = sessionDates.map(({ date, sessionNumber }) => ({
  cohort_id: data.id,
  session_date: date.toISOString().split('T')[0], // YYYY-MM-DD format
  session_number: sessionNumber,
  status: 'scheduled',
}));

await supabaseAdmin
  .from('cohort_sessions')
  .insert(sessionsToInsert);

// 4. Update cohort's session count
await supabaseAdmin
  .from('cohorts')
  .update({ sessions: sessionDates.length })
  .eq('id', data.id);
```

### 2. **Session Generation Algorithm**

**File:** `src/lib/sessionGenerator.ts`

The `generateCohortSessions()` function implements the scheduling logic:

**Rules:**
- ✅ 3 sessions per week (Monday-Saturday)
- ❌ Sundays are always excluded
- 📅 Sessions occur every 2 days (e.g., Mon → Wed → Fri)
- 🔢 Sequential session numbers (1, 2, 3, ...)

**Algorithm Steps:**
1. Start from cohort start date (skip to Monday if Sunday)
2. Track sessions per week (reset each Monday)
3. Add session if less than 3 sessions this week
4. Move to next session date (add 2 days, skip Sunday if hit)
5. If 3 sessions reached, move to next week's Monday
6. Continue until end date is reached

**Example:**
- Start: Friday, Jan 5, 2026
- Sessions: 
  - Jan 5 (Fri) - Session 1
  - Jan 8 (Mon) - Session 2
  - Jan 10 (Wed) - Session 3
  - Jan 12 (Fri) - Session 4
  - Jan 15 (Mon) - Session 5
  - ... (continues until end date)

### 3. **Manual Session Regeneration**

**File:** `src/app/api/cohorts/generate-sessions/route.ts`

Admins can regenerate sessions for existing cohorts:

```typescript
// 1. Delete existing sessions
await supabaseAdmin
  .from('cohort_sessions')
  .delete()
  .eq('cohort_id', cohortId);

// 2. Generate new sessions (same algorithm)
const sessionDates = generateCohortSessions(startDate, endDate);

// 3. Insert new sessions
await supabaseAdmin
  .from('cohort_sessions')
  .insert(sessionsToInsert);
```

### 4. **Session Rearrangement**

**File:** `src/app/api/admin/cohorts/rearrange-sessions/route.ts`

Admins can rearrange sessions with a new start date:

- Maintains Mon/Wed/Fri pattern
- Skips Sundays
- Respects fixed dates for specific sessions (e.g., Session 4, 6, 8)
- Shifts all subsequent sessions accordingly

## 🔌 API Endpoints

### GET `/api/sessions`

**File:** `src/app/api/sessions/route.ts`

Fetches sessions based on different access patterns:

#### **Admin Access** (`?admin=true`)
```typescript
// Requires admin authentication
const { data: sessions } = await supabaseAdmin
  .from('cohort_sessions')
  .select(`
    *,
    cohorts (
      id,
      name,
      level,
      status
    )
  `)
  .order('session_date', { ascending: true })
  .order('session_number', { ascending: true });
```

**Returns:** All sessions in the system with cohort information

#### **Student Access by Cohort** (`?cohortId=uuid`)
```typescript
// Direct cohort lookup
const { data: sessions } = await supabaseAdmin
  .from('cohort_sessions')
  .select('*, cohorts(*)')
  .eq('cohort_id', cohortId)
  .order('session_date', { ascending: true });
```

**Returns:** Sessions for a specific cohort

#### **Student Access by Email** (`?email=student@example.com`)
```typescript
// 1. Find student's profile
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('id')
  .eq('email', email)
  .maybeSingle();

// 2. Find enrolled cohorts
const { data: enrollments } = await supabaseAdmin
  .from('cohort_enrollment')
  .select('cohort_id')
  .eq('student_id', profile.id);

// 3. Fetch sessions for enrolled cohorts
const cohortIds = enrollments.map(e => e.cohort_id);
const { data: sessions } = await supabaseAdmin
  .from('cohort_sessions')
  .select('*, cohorts(*)')
  .in('cohort_id', cohortIds)
  .order('session_date', { ascending: true });
```

**Returns:** Sessions for all cohorts the student is enrolled in

### PUT `/api/sessions/[sessionId]`

**File:** `src/app/api/sessions/[sessionId]/route.ts`

Updates individual session details:

```typescript
// Allowed fields to update
const updateData = {
  session_date?: string,
  topic?: string,
  instructor?: string,
  duration_minutes?: number,
  link?: string,
  recording_url?: string,
  status?: string
};

await supabaseAdmin
  .from('cohort_sessions')
  .update(updateData)
  .eq('id', sessionId);
```

**Features:**
- Date conflict detection (prevents duplicate dates)
- Option to shift subsequent sessions when date changes
- Validates duration (1-600 minutes)

## 🎨 UI Display Flow

### 1. **Calendar Component**

**File:** `src/components/Calendar.tsx`

The Calendar component fetches and displays sessions:

```typescript
// Fetch sessions based on context
const sessionsUrl = showCohorts
  ? '/api/sessions?admin=true'  // Admin: all sessions
  : cohortId
  ? `/api/sessions?cohortId=${cohortId}`  // Specific cohort
  : `/api/sessions?email=${email}`;  // Student's sessions

const sessionsResponse = await fetch(sessionsUrl);
const sessionsData = await sessionsResponse.json();

// Transform sessions to calendar events
const sessionEvents: CalendarEvent[] = sessionsData.sessions.map((session) => ({
  id: `session-${session.id}`,
  title: `${cohortName} - Session ${session.session_number}`,
  date: new Date(session.session_date),
  type: 'live-class',
  time: `${session.duration_minutes} min`,
  link: session.link || '#',
  description: session.topic || `Cohort session ${session.session_number}`,
}));
```

**Display Features:**
- Month view with session dates highlighted
- List view showing upcoming sessions
- Click to view/edit session details
- Color-coded by event type
- "Today" highlighting

### 2. **Admin Sessions Table**

**File:** `src/app/admin/page.tsx`

The admin dashboard displays sessions in a structured table:

```typescript
// Fetch all sessions
const fetchSessions = async () => {
  const res = await fetchWithAuth('/api/sessions?admin=true');
  const data = await res.json();
  setAllSessions(data.sessions || []);
};

// Display in table with filters
- Filter by cohort
- Filter by status (scheduled, completed, cancelled, rescheduled)
- Filter by date (all, upcoming, past)
- Sort by date and session number
```

**Table Columns:**
- Session #
- Date (with day name)
- Cohort name
- Topic
- Instructor
- Duration
- Status (color-coded badge)
- Link (if available)

### 3. **Session Statistics**

The admin dashboard shows:
- Total Sessions count
- Scheduled sessions count
- Completed sessions count
- Upcoming sessions count

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Cohort Created │
│ (with dates)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Session│
│     Dates        │
│ (Mon/Wed/Fri)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Insert into    │
│ cohort_sessions │
│     table       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Endpoint   │
│ /api/sessions   │
│ (with filters)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  UI Components  │
│  - Calendar     │
│  - Sessions     │
│    Table        │
└─────────────────┘
```

## 🔐 Security & Access Control

### Row Level Security (RLS)

```sql
-- Public read access (students can see their cohort sessions)
CREATE POLICY "Allow public read access" 
ON cohort_sessions FOR SELECT 
USING (true);

-- Admin operations use supabaseAdmin client (bypasses RLS)
```

### API Authentication

- **Admin endpoints:** Require admin session authentication
- **Student endpoints:** Use student profile ID or email
- **Public read:** Sessions are readable (RLS allows it)

## 📝 Key Features

1. **Automatic Generation:** Sessions created automatically when cohort is created
2. **Flexible Scheduling:** Mon/Wed/Fri pattern with Sunday exclusion
3. **Edit Capability:** Admins can edit individual sessions
4. **Date Conflict Prevention:** Prevents duplicate session dates
5. **Cascading Updates:** Option to shift subsequent sessions when date changes
6. **Multi-View Display:** Calendar view and table view
7. **Filtering & Sorting:** Multiple filter options for easy management
8. **Statistics:** Real-time session statistics

## 🛠️ Database Operations

### Common Queries

**Get all sessions for a cohort:**
```sql
SELECT * FROM cohort_sessions 
WHERE cohort_id = 'uuid' 
ORDER BY session_date, session_number;
```

**Get upcoming sessions:**
```sql
SELECT * FROM cohort_sessions 
WHERE session_date >= CURRENT_DATE 
AND status = 'scheduled'
ORDER BY session_date;
```

**Get sessions with cohort info:**
```sql
SELECT cs.*, c.name as cohort_name 
FROM cohort_sessions cs
JOIN cohorts c ON cs.cohort_id = c.id
ORDER BY cs.session_date;
```

## 🔄 Update Flow

When a session is updated:

1. **Client:** User edits session in UI (SessionEditModal)
2. **API:** PUT request to `/api/sessions/[sessionId]`
3. **Validation:** Check for date conflicts
4. **Update:** Update session in database
5. **Refresh:** UI fetches updated sessions
6. **Display:** Updated data shown in calendar/table

## 📊 Performance Considerations

- **Indexes:** Optimized for common queries (cohort_id, session_date)
- **Joins:** Efficient joins with cohorts table using foreign keys
- **Caching:** Consider caching for frequently accessed sessions
- **Pagination:** For large datasets, consider pagination

## 🎯 Summary

Sessions flow from database → API → UI in a structured way:

1. **Storage:** `cohort_sessions` table with proper constraints
2. **Generation:** Automatic algorithm creates sessions based on dates
3. **API:** RESTful endpoints with different access patterns
4. **UI:** Multiple views (calendar, table) with filtering
5. **Updates:** Real-time updates with conflict prevention

The system ensures data integrity, provides flexible access patterns, and offers a user-friendly interface for managing cohort sessions.

