# Admin Page Architecture Overview

This document explains how the admin dashboard page (`src/app/admin/page.tsx`) is structured and built.

## 📋 Table of Contents

1. [Overall Structure](#overall-structure)
2. [Authentication & Session Management](#authentication--session-management)
3. [State Management](#state-management)
4. [Data Fetching](#data-fetching)
5. [UI Structure & Tabs](#ui-structure--tabs)
6. [Key Components](#key-components)
7. [API Integration](#api-integration)
8. [Data Flow](#data-flow)

---

## 🏗️ Overall Structure

### File Location
- **Main Component**: `src/app/admin/page.tsx`
- **Layout**: `src/app/admin/layout.tsx`
- **Type**: Client-side React component (`'use client'`)

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React with Hooks
- **Styling**: Tailwind CSS
- **State Management**: React useState, useMemo, useRef
- **Data Fetching**: Fetch API with custom `fetchWithAuth` wrapper
- **Lazy Loading**: Next.js `dynamic()` for heavy components

---

## 🔐 Authentication & Session Management

### Session Hook
```typescript
const { isAuthenticated, email, role, loading: authLoading, 
        showSessionExpired, setShowSessionExpired, logout, checkSession } 
  = useSession('admin');
```

**Features:**
- Uses `useSession('admin')` hook from `@/hooks/useSession`
- Handles admin session authentication
- Manages session expiration and refresh
- Shows session expired modal when needed

### Authentication Flow
1. **Check Session**: On mount, checks if admin is authenticated
2. **Login Form**: If not authenticated, shows login form
3. **Session Refresh**: Automatically refreshes session to prevent expiration
4. **Logout**: Clears session and redirects to login

### Protected Routes
- All admin functionality requires authentication
- API calls use `fetchWithAuth` which includes session cookies
- 401 responses trigger session check and logout

---

## 📊 State Management

### Data State
The page manages multiple data types:

```typescript
// Core Data
const [applications, setApplications] = useState<Application[]>([]);
const [cohorts, setCohorts] = useState<Cohort[]>([]);
const [overview, setOverview] = useState<OverviewSummary | null>(null);
const [events, setEvents] = useState<EventItem[]>([]);
const [progress, setProgress] = useState<ProgressItem[]>([]);
const [mentorships, setMentorships] = useState<MentorshipApp[]>([]);
const [liveClassEvents, setLiveClassEvents] = useState<EventItem[]>([]);
const [allSessions, setAllSessions] = useState<any[]>([]);
```

### UI State
```typescript
// Navigation & Tabs
const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'students' | 'events' | 'mentorships' | 'attendance' | 'exam' | 'assignments'>('overview');

// Filters
const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
const [cohortFilter, setCohortFilter] = useState<string | null>(null);
const [sessionCohortFilter, setSessionCohortFilter] = useState<string | null>(null);
const [sessionStatusFilter, setSessionStatusFilter] = useState<string>('all');
const [sessionDateFilter, setSessionDateFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

// Forms
const [eventForm, setEventForm] = useState({...});
const [cohortForm, setCohortForm] = useState({...});

// Loading & Processing
const [loading, setLoading] = useState(true);
const [processing, setProcessing] = useState<string | null>(null);
const [creatingEvent, setCreatingEvent] = useState(false);
const [creatingCohort, setCreatingCohort] = useState(false);
```

### Modal & Detail State
```typescript
const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
const [applicationDetails, setApplicationDetails] = useState<Record<string, any>>({});
const [selectedStudent, setSelectedStudent] = useState<{ id: string; email: string; name: string } | null>(null);
```

---

## 🔄 Data Fetching

### Initial Data Load
```typescript
useEffect(() => {
  if (isAuthenticated && admin && !hasLoadedRef.current) {
    hasLoadedRef.current = true;
    loadData();
  }
}, [isAuthenticated, admin]);
```

**Loads all data in parallel:**
- Applications
- Cohorts
- Overview statistics
- Events
- Student progress
- Live class events
- Mentorships
- Exam access
- Submissions
- Blog submissions
- Sessions

### Fetch Functions
Each data type has its own fetch function:

```typescript
const fetchApplications = async () => {
  const res = await fetchWithAuth('/api/admin/applications');
  const data = await res.json();
  setApplications(data.applications || []);
};

const fetchCohorts = async () => { ... };
const fetchOverview = async () => { ... };
const fetchEvents = async () => { ... };
// ... etc
```

### Authentication Wrapper
```typescript
const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (res.status === 401) {
    await checkSession(); // Handle session expiration
    throw new Error('Unauthorized');
  }
  return res;
};
```

---

## 🎨 UI Structure & Tabs

### Tab System
The admin page uses a tab-based navigation system:

**Available Tabs:**
1. **Overview** - Dashboard with statistics and overview cards
2. **Applications** - Student application management
3. **Students** - Student database and progress tracking
4. **Events** - Event management and calendar
5. **Mentorships** - Mentorship application management
6. **Attendance** - Attendance tracking and CSV upload
7. **Exam** - Exam access management
8. **Assignments** - Assignment submissions and grading

### Tab Navigation
```typescript
const [activeTab, setActiveTab] = useState<'overview' | ...>('overview');

// Tab buttons render conditionally based on activeTab
{activeTab === 'overview' && <OverviewSection />}
{activeTab === 'applications' && <ApplicationsSection />}
// ... etc
```

### Conditional Rendering
Each tab section is conditionally rendered based on `activeTab`:
- Only the active tab's content is rendered
- Improves performance by not rendering hidden sections
- Maintains state when switching tabs

---

## 🧩 Key Components

### Lazy-Loaded Components
Heavy components are lazy-loaded for better performance:

```typescript
const SessionExpiredModal = dynamic(() => import('@/components/SessionExpiredModal'), {
  ssr: false,
  loading: () => null,
});

const Calendar = dynamic(() => import('@/components/Calendar'), {
  ssr: false,
  loading: () => <div>Loading calendar...</div>,
});
```

### External Components
- **EmailComposer**: Email composition interface
- **StudentProgressModal**: Modal for viewing student progress details
- **Calendar**: Calendar component for events and sessions
- **SessionExpiredModal**: Modal shown when session expires

---

## 🔌 API Integration

### API Endpoints Used

**Applications:**
- `GET /api/admin/applications` - Fetch all applications
- `PATCH /api/admin/applications` - Update application status

**Cohorts:**
- `GET /api/cohorts` - Fetch all cohorts
- `POST /api/cohorts` - Create new cohort
- `POST /api/cohorts/generate-sessions` - Regenerate sessions
- `POST /api/admin/cohorts/rearrange-sessions` - Rearrange sessions

**Events:**
- `GET /api/events` - Fetch events
- `GET /api/admin/events/all` - Fetch all events (admin)
- `POST /api/events/create` - Create event
- `PUT /api/admin/events/[id]` - Update event
- `DELETE /api/admin/events/[id]` - Delete event

**Sessions:**
- `GET /api/sessions?admin=true` - Fetch all sessions (admin)
- `PUT /api/sessions/[sessionId]` - Update session

**Students:**
- `GET /api/admin/students/progress` - Fetch student progress

**Overview:**
- `GET /api/admin/overview` - Fetch dashboard statistics

**Attendance:**
- `POST /api/admin/attendance/upload` - Upload attendance CSV

---

## 📈 Data Flow

### 1. Initial Load Flow
```
User visits /admin
  ↓
Check authentication (useSession)
  ↓
If authenticated → Load all data (loadData)
  ↓
Fetch: Applications, Cohorts, Overview, Events, Progress, etc.
  ↓
Update state with fetched data
  ↓
Render UI based on activeTab
```

### 2. Data Update Flow
```
User action (e.g., approve application)
  ↓
Call API endpoint (fetchWithAuth)
  ↓
Update database
  ↓
Refresh relevant data (fetchApplications, etc.)
  ↓
Update UI state
  ↓
Re-render affected components
```

### 3. Filter & Search Flow
```
User applies filter/search
  ↓
Update filter state (setFilter, setCohortFilter, etc.)
  ↓
useMemo recalculates filtered data
  ↓
Re-render with filtered results
```

---

## 🎯 Key Sections

### 1. Overview Tab
- **Overview Cards**: Statistics (Total, Pending, Approved, Rejected, Students, Cohorts, Events)
- **Quick Actions**: Links to other sections
- **Recent Activity**: Summary of recent actions

### 2. Applications Tab
- **Filter Tabs**: All, Pending, Approved, Rejected
- **Cohort Filter**: Filter by specific cohort
- **Application Cards**: Grid view of applications
- **Expandable Details**: Click to see full application details
- **Status Actions**: Approve/Reject buttons

### 3. Students Tab
- **Student Database Table**: List of all approved students
- **Progress Tracking**: Chapter completion, attendance, etc.
- **Cohort Filter**: Filter students by cohort
- **Attendance Sort**: Sort by attendance percentage
- **Student Details Modal**: Detailed progress view

### 4. Events Tab
- **Event List**: All events in the system
- **Create Event Form**: Create new events
- **Event Management**: Edit/Delete events
- **Calendar View**: Visual calendar with events

### 5. Manage Cohorts Section
- **Cohort List**: All cohorts with details
- **Create Cohort Form**: Create new cohorts
- **Regenerate Sessions**: Regenerate sessions for a cohort
- **Rearrange Sessions**: Rearrange sessions with new start date

### 6. Calendar Section
- **Calendar Component**: Month/List view
- **Sessions Table**: Structured table of all sessions
- **Filters**: Cohort, Status, Date filters
- **Statistics**: Session counts and statistics

### 7. Sessions Table
- **All Sessions**: Complete list of all cohort sessions
- **Filters**: Cohort, Status, Date (all/upcoming/past)
- **Statistics Cards**: Total, Scheduled, Completed, Upcoming counts
- **Color Coding**: Cohort-based colors for visual distinction

---

## 🔧 Key Functions

### Data Fetching Functions
- `loadData()` - Loads all initial data
- `fetchApplications()` - Fetch applications
- `fetchCohorts()` - Fetch cohorts
- `fetchOverview()` - Fetch overview statistics
- `fetchEvents()` - Fetch events
- `fetchProgress()` - Fetch student progress
- `fetchSessions()` - Fetch all sessions

### Action Functions
- `updateApplicationStatus()` - Approve/Reject applications
- `createEvent()` - Create new event
- `createCohort()` - Create new cohort
- `regenerateSessions()` - Regenerate cohort sessions
- `rearrangeSessions()` - Rearrange sessions with new dates
- `uploadAttendance()` - Upload attendance CSV

### Utility Functions
- `fetchWithAuth()` - Authenticated fetch wrapper
- `getCohortColor()` - Get consistent color for cohort
- `getStatusClass()` - Get CSS class for status badge

---

## 🎨 Styling

### Design System
- **Color Scheme**: Dark theme with zinc/cyan accents
- **Status Colors**: 
  - Green: Approved/Completed
  - Red: Rejected/Cancelled
  - Yellow: Pending
  - Blue/Cyan: Active/Info
- **Cohort Colors**: 10-color palette for visual distinction

### Component Styling
- Uses Tailwind CSS utility classes
- Consistent border, background, and text colors
- Responsive design with breakpoints (sm, lg)
- Hover states and transitions

---

## 🔄 State Updates & Re-renders

### Memoized Computations
```typescript
const filteredApplications = useMemo(() => {
  // Filter and sort applications based on current filters
}, [applications, filter, cohortFilter]);

const filteredAndSortedProgress = useMemo(() => {
  // Filter and sort student progress
}, [progress, cohortFilter, attendanceSort]);
```

### Optimizations
- `useMemo` for expensive filtering/sorting
- `useRef` to prevent duplicate data loads
- Conditional rendering to avoid unnecessary renders
- Lazy loading for heavy components

---

## 📝 Form Management

### Event Form
```typescript
const [eventForm, setEventForm] = useState({
  name: '',
  type: 'live-class',
  start_time: '',
  end_time: '',
  description: '',
  link: '',
  cohort_id: 'for_all',
  chapter_number: '',
});
```

### Cohort Form
```typescript
const [cohortForm, setCohortForm] = useState({
  name: '',
  start_date: '',
  end_date: '',
  seats_total: '',
  level: 'Beginner',
  status: 'Upcoming',
  sessions: '',
});
```

**Form Submission:**
- Validates input
- Shows loading state
- Calls API
- Refreshes data on success
- Shows error messages on failure

---

## 🚀 Performance Optimizations

1. **Lazy Loading**: Heavy components loaded on demand
2. **Memoization**: Expensive computations cached
3. **Conditional Rendering**: Only active tab rendered
4. **Parallel Fetching**: All data fetched in parallel
5. **Ref-based Guards**: Prevents duplicate data loads
6. **Optimistic Updates**: UI updates before API confirmation

---

## 🔐 Security

1. **Authentication Required**: All routes protected
2. **Session Management**: Automatic session refresh
3. **API Authentication**: All API calls include session cookies
4. **Error Handling**: Graceful handling of auth failures
5. **Input Validation**: Client and server-side validation

---

## 📊 Data Structures

### Application
```typescript
interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  status: string;
  preferred_cohort_id: string | null;
  created_at: string;
}
```

### Cohort
```typescript
interface Cohort {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  level?: string | null;
  seats?: number | null;
  enrolled?: number | null;
}
```

### ProgressItem
```typescript
interface ProgressItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  cohortId: string | null;
  cohortName: string | null;
  completedChapters: number;
  unlockedChapters: number;
  attendancePercent?: number;
  overallProgress?: number;
}
```

---

## 🎯 Summary

The admin page is a comprehensive dashboard built with:
- **React Hooks** for state management
- **Tab-based navigation** for organizing features
- **Parallel data fetching** for performance
- **Lazy loading** for heavy components
- **Memoization** for expensive computations
- **Authentication** throughout
- **Responsive design** with Tailwind CSS

The architecture is modular, with clear separation between:
- Data fetching
- State management
- UI rendering
- API integration

Each section is self-contained but shares common state and utilities, making it easy to maintain and extend.

