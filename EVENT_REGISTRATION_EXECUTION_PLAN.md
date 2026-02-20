# Event Registration System - Execution Plan

## Overview

Build a reusable event registration system where multiple events can reuse the same form, registrations are linked to specific events, and events can optionally define custom fields. The system remains scalable and maintainable.

**Core Principle**: The form is reusable. The event is dynamic.

**Important Constraint**: Registration system is **ONLY for non-cohort events** (events where `cohort_id IS NULL`). Cohort-based events (where `cohort_id` is set) are managed separately and do not use this registration system.

**Flow**: User → Event Page → Click Register → Form loads with eventId → Submit → Registration stored with event reference

### Cohort Event Exclusion

**Critical Requirement**: The registration system is **exclusively for non-cohort events**. 

- **Non-cohort events** (`cohort_id IS NULL`): Can have registration enabled
- **Cohort-based events** (`cohort_id IS NOT NULL`): Cannot use registration system

This separation ensures:
1. Cohort events remain managed through the existing cohort enrollment system
2. Public events (non-cohort) can have open registration
3. Clear separation of concerns between cohort management and public event registration

**Implementation Points**:
- Database constraint prevents enabling registration on cohort events
- API validates `cohort_id IS NULL` before processing registration
- Frontend filters out cohort events from registration-enabled event lists
- Registration form page returns error if event is cohort-based

---

## Phase 1: Database Setup

### 1.1 Extend Events Table

**File**: `supabase/add-event-registration-fields.sql`

Add registration-related fields to the existing `events` table:

```sql
-- Add registration-related columns to events table
-- NOTE: Registration is ONLY for non-cohort events (cohort_id IS NULL)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_registration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_registrations INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add constraint: Registration can only be enabled for non-cohort events
ALTER TABLE events
ADD CONSTRAINT check_registration_no_cohort 
CHECK (
  (is_registration_enabled = false) OR 
  (is_registration_enabled = true AND cohort_id IS NULL)
);

-- Add index for registration-enabled events (only non-cohort events)
CREATE INDEX IF NOT EXISTS idx_events_registration_enabled ON events(is_registration_enabled, cohort_id) 
WHERE is_registration_enabled = true AND cohort_id IS NULL;

-- Add comment for form_config
COMMENT ON COLUMN events.form_config IS 'JSON configuration for dynamic form fields. Only applicable for non-cohort events (cohort_id IS NULL). Example: {"fields": [{"name": "company", "type": "text", "required": true}, {"name": "experience_level", "type": "select", "options": ["Beginner", "Intermediate", "Advanced"]}]}';
COMMENT ON COLUMN events.is_registration_enabled IS 'Registration can only be enabled for non-cohort events (cohort_id must be NULL).';
```

**Tasks**:
- [ ] Create SQL migration file
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify columns were added successfully

### 1.2 Create Registrations Table

**File**: `supabase/create-event-registrations-table.sql`

```sql
-- Create event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  additional_data JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate registrations per event (same email)
  UNIQUE(event_id, email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON event_registrations(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role (API) can insert/read registrations
-- Clients cannot directly access this table
CREATE POLICY "API only - no direct client access - event_registrations"
ON event_registrations
FOR ALL
USING (false)
WITH CHECK (false);

-- Add comment
COMMENT ON TABLE event_registrations IS 'Stores registrations for events. Linked to events table via event_id.';
COMMENT ON COLUMN event_registrations.additional_data IS 'JSON object storing custom form field values when form_config is used.';
```

**Tasks**:
- [ ] Create SQL migration file
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify table and indexes were created
- [ ] Test foreign key constraint

### 1.3 Seed Test Events

**File**: `supabase/seed-test-events.sql`

```sql
-- Insert test events with registration enabled
-- IMPORTANT: cohort_id must be NULL for registration-enabled events
INSERT INTO events (
  name,
  type,
  description,
  start_time,
  end_time,
  location,
  event_date,
  cohort_id,  -- Explicitly set to NULL for non-cohort events
  is_registration_enabled,
  form_config,
  max_registrations
) VALUES
(
  'Bitcoin Workshop: Introduction to Lightning Network',
  'workshop',
  'Learn the basics of the Lightning Network and how to use it for fast, low-cost Bitcoin transactions.',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
  'Virtual (Zoom)',
  NOW() + INTERVAL '7 days',
  NULL,  -- Non-cohort event
  true,
  NULL,
  50
),
(
  'Advanced Bitcoin Development Meetup',
  'workshop',
  'Deep dive into Bitcoin development for experienced developers.',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days' + INTERVAL '4 hours',
  'Lagos, Nigeria',
  NOW() + INTERVAL '14 days',
  NULL,  -- Non-cohort event
  true,
  '{
    "fields": [
      {
        "name": "company",
        "type": "text",
        "label": "Company Name",
        "required": true
      },
      {
        "name": "experience_level",
        "type": "select",
        "label": "Experience Level",
        "required": true,
        "options": ["Beginner", "Intermediate", "Advanced"]
      },
      {
        "name": "github_username",
        "type": "text",
        "label": "GitHub Username",
        "required": false
      }
    ]
  }'::jsonb,
  30
)
ON CONFLICT DO NOTHING;
```

**Tasks**:
- [ ] Create seed file
- [ ] Run seed script in Supabase SQL Editor
- [ ] Verify test events were created
- [ ] Test querying events with registration enabled

---

## Phase 2: Backend API

### 2.1 Create Registration Endpoint

**File**: `src/app/api/events/[eventId]/register/route.ts`

**Requirements**:
- Validate event exists and is active
- Validate event has registration enabled
- Validate form input (full_name, email, phone)
- Check for duplicate email per event
- Check max_registrations limit if set
- Insert registration into database
- Return success response

**Implementation Steps**:
1. Extract `eventId` from route params
2. Validate `eventId` is valid UUID
3. Query event from database using `supabaseAdmin`
4. Check event exists
5. **Check `cohort_id IS NULL` (registration only for non-cohort events)**
6. Check `is_registration_enabled` is true
7. Check `registration_deadline` hasn't passed (if set)
8. Validate request body (full_name, email, phone)
9. Check for duplicate email for this event
10. Check current registration count vs `max_registrations` (if set)
11. Insert registration
12. Return success response

**Tasks**:
- [ ] Create API route file
- [ ] Implement event validation
- [ ] Implement input validation using existing validation utilities
- [ ] Implement duplicate check
- [ ] Implement max registrations check
- [ ] Add error handling
- [ ] Add logging

### 2.2 Add Rate Limiting

**File**: `src/lib/api-rate-limit.ts`

Add registration endpoint to rate limit configuration:

```typescript
EVENT_REGISTRATION: {
  max: 5, // 5 registrations per window
  windowMs: 15 * 60 * 1000, // 15 minutes
},
```

Update `getRateLimitForPath` function:

```typescript
// Event registration routes
if (path.includes('/events/') && path.includes('/register')) {
  return ENDPOINT_RATE_LIMITS.EVENT_REGISTRATION;
}
```

**Tasks**:
- [ ] Add EVENT_REGISTRATION to ENDPOINT_RATE_LIMITS
- [ ] Update getRateLimitForPath function
- [ ] Test rate limiting works

### 2.3 Create Get Event Endpoint (if needed)

**File**: `src/app/api/events/[eventId]/route.ts`

Create endpoint to fetch single event details (for form to load event info).

**Tasks**:
- [ ] Create GET endpoint for single event
- [ ] Return event details including form_config
- [ ] Handle event not found

### 2.4 Create Get Registrations Endpoint (Admin)

**File**: `src/app/api/events/[eventId]/registrations/route.ts`

Admin-only endpoint to view registrations for an event.

**Tasks**:
- [ ] Create GET endpoint
- [ ] Add admin authentication check
- [ ] Return registrations list
- [ ] Add pagination if needed

---

## Phase 3: Frontend Form

### 3.1 Create EventRegistrationForm Component

**File**: `src/components/EventRegistrationForm.tsx`

**Props**:
```typescript
interface EventRegistrationFormProps {
  eventId: string;
  eventTitle?: string;
  formConfig?: FormConfig | null;
  onSuccess?: () => void;
}
```

**Features**:
- Fetch event details on mount (if eventTitle/formConfig not provided)
- Render base fields: full_name, email, phone
- Dynamically render custom fields from formConfig
- Form validation
- Loading spinner during submission
- Success confirmation
- Disable submit button while submitting
- Error handling and display

**State Management**:
```typescript
{
  isLoading: boolean;
  isSubmitting: boolean;
  formData: Record<string, any>;
  errors: Record<string, string>;
  success: boolean;
  error: string | null;
}
```

**Tasks**:
- [ ] Create component file
- [ ] Implement base form fields
- [ ] Implement dynamic field rendering
- [ ] Add form validation
- [ ] Add loading states
- [ ] Add success state
- [ ] Add error handling
- [ ] Style with Tailwind CSS

### 3.2 Create Form Field Types

**File**: `src/components/EventRegistrationForm.tsx` (within same file)

Support field types:
- `text` - Text input
- `email` - Email input
- `phone` - Phone input
- `select` - Dropdown select
- `textarea` - Multi-line text

**Tasks**:
- [ ] Implement text field component
- [ ] Implement email field component
- [ ] Implement phone field component
- [ ] Implement select field component
- [ ] Implement textarea field component

### 3.3 Create Form Validation Logic

**File**: `src/components/EventRegistrationForm.tsx`

Use existing validation utilities:
- `validateAndNormalizeEmail` from `@/lib/validation`
- `sanitizeName` from `@/lib/validation`
- `isValidPhone` from `@/lib/validation`

**Tasks**:
- [ ] Add client-side validation
- [ ] Validate required fields
- [ ] Validate email format
- [ ] Validate phone format (if provided)
- [ ] Show validation errors

---

## Phase 4: Event Pages

### 4.1 Create Event List Page

**File**: `src/app/events/page.tsx`

**Features**:
- Display list of events with registration enabled **AND cohort_id IS NULL** (non-cohort events only)
- Show event title, date, location, description
- Show registration status (open/closed/full)
- "View Details" button linking to event detail page
- Filter by upcoming/past events
- **Exclude cohort-based events from this list**

**Tasks**:
- [ ] Create page file
- [ ] Fetch events with `is_registration_enabled = true AND cohort_id IS NULL`
- [ ] Display event cards
- [ ] Add "View Details" links
- [ ] Style with Tailwind CSS
- [ ] Add loading state
- [ ] Add empty state

### 4.2 Create Event Details Page

**File**: `src/app/events/[id]/page.tsx`

**Features**:
- Display full event details
- **Check if event is cohort-based (cohort_id IS NOT NULL) - if so, hide registration**
- Show registration status (only for non-cohort events)
- "Register" button (links to registration form) - **only show if cohort_id IS NULL**
- Show current registration count (if admin or if public)
- Display event date, time, location
- Display description

**Tasks**:
- [ ] Create page file
- [ ] Fetch event by ID
- [ ] Display event information
- [ ] Add "Register" button
- [ ] Handle event not found
- [ ] Style with Tailwind CSS

### 4.3 Create Registration Page

**File**: `src/app/events/[id]/register/page.tsx`

**Features**:
- Load event details
- **Check if event is cohort-based (cohort_id IS NOT NULL) - if so, show error**
- Render EventRegistrationForm component
- Pass eventId, eventTitle, formConfig to form
- Handle success (redirect or show message)
- Show error if event not found, registration disabled, or **if event is cohort-based**

**Tasks**:
- [ ] Create page file
- [ ] Fetch event details
- [ ] Render EventRegistrationForm
- [ ] Handle success callback
- [ ] Add error handling
- [ ] Style with Tailwind CSS

---

## Phase 5: Optional Enhancements

### 5.1 Email Confirmation

**File**: `src/lib/email.ts` (extend existing)

**Features**:
- Send confirmation email to registrant
- Include event details
- Include registration confirmation

**Tasks**:
- [ ] Create email template
- [ ] Add sendRegistrationConfirmationEmail function
- [ ] Call from registration API endpoint
- [ ] Test email delivery

### 5.2 Admin Dashboard View

**File**: `src/app/admin/events/[id]/registrations/page.tsx`

**Features**:
- List all registrations for an event
- Show registration details
- Export to CSV functionality
- Search/filter registrations
- Delete registration (with confirmation)

**Tasks**:
- [ ] Create admin page
- [ ] Fetch registrations for event
- [ ] Display in table format
- [ ] Add search/filter
- [ ] Add CSV export
- [ ] Add delete functionality

### 5.3 CSV Export

**File**: `src/app/api/events/[eventId]/registrations/export/route.ts`

**Features**:
- Generate CSV file with all registrations
- Include base fields + custom fields
- Downloadable file

**Tasks**:
- [ ] Create export endpoint
- [ ] Generate CSV content
- [ ] Return CSV file
- [ ] Add admin authentication

### 5.4 Duplicate Prevention Logic

Already implemented in database (UNIQUE constraint on event_id + email), but add:

**Additional Features**:
- Check before submission (optimistic check)
- Show user-friendly error message
- Suggest "Already registered" message

**Tasks**:
- [ ] Add duplicate check in API (already in DB)
- [ ] Improve error message
- [ ] Add client-side check (optional)

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Extend events table with registration fields
- [ ] Create event_registrations table
- [ ] Add indexes and constraints
- [ ] Seed test events
- [ ] Verify database structure

### Phase 2: Backend API
- [ ] Create POST /api/events/[eventId]/register endpoint
- [ ] Add validation logic
- [ ] Add rate limiting
- [ ] Create GET /api/events/[eventId] endpoint
- [ ] Create GET /api/events/[eventId]/registrations endpoint (admin)
- [ ] Test all endpoints with Postman/curl

### Phase 3: Frontend Form
- [ ] Create EventRegistrationForm component
- [ ] Implement base fields
- [ ] Implement dynamic field rendering
- [ ] Add validation
- [ ] Add loading/success states
- [ ] Style component

### Phase 4: Event Pages
- [ ] Create /events list page
- [ ] Create /events/[id] detail page
- [ ] Create /events/[id]/register page
- [ ] Add navigation links
- [ ] Test user flow

### Phase 5: Optional Enhancements
- [ ] Email confirmation
- [ ] Admin dashboard view
- [ ] CSV export
- [ ] Enhanced duplicate prevention

---

## File Structure

```
supabase/
├── add-event-registration-fields.sql
├── create-event-registrations-table.sql
└── seed-test-events.sql

src/
├── app/
│   ├── api/
│   │   └── events/
│   │       ├── [eventId]/
│   │       │   ├── route.ts (GET single event)
│   │       │   ├── register/
│   │       │   │   └── route.ts (POST registration)
│   │       │   └── registrations/
│   │       │       ├── route.ts (GET registrations - admin)
│   │       │       └── export/
│   │       │           └── route.ts (GET CSV export - admin)
│   ├── events/
│   │   ├── page.tsx (Event list)
│   │   └── [id]/
│   │       ├── page.tsx (Event details)
│   │       └── register/
│   │           └── page.tsx (Registration form)
│   └── admin/
│       └── events/
│           └── [id]/
│               └── registrations/
│                   └── page.tsx (Admin view)
└── components/
    └── EventRegistrationForm.tsx
```

---

## Testing Plan

### Unit Tests
- [ ] Form validation logic
- [ ] Dynamic field rendering
- [ ] API validation functions

### Integration Tests
- [ ] Registration flow end-to-end
- [ ] Duplicate prevention
- [ ] Max registrations limit
- [ ] Dynamic form fields

### Manual Testing
- [ ] Register for event with base fields
- [ ] Register for event with custom fields
- [ ] Test duplicate email prevention
- [ ] Test max registrations limit
- [ ] Test rate limiting
- [ ] Test admin registration view
- [ ] Test CSV export

---

## Security Considerations

1. **Input Validation**: All inputs validated and sanitized using existing utilities
2. **Rate Limiting**: Registration endpoint rate limited (5 per 15 minutes)
3. **RLS Policies**: Registrations table protected by RLS (API only)
4. **SQL Injection**: Using parameterized queries via Supabase
5. **XSS Prevention**: Input sanitization in place
6. **Duplicate Prevention**: Database-level UNIQUE constraint
7. **Admin Access**: Admin endpoints require authentication
8. **Cohort Event Protection**: Database constraint and API validation ensure registration is only for non-cohort events

---

## Notes

- Uses existing validation utilities (no Zod needed)
- Follows existing code patterns and structure
- Integrates with existing rate limiting system
- Uses Supabase for database operations
- TypeScript for type safety
- Tailwind CSS for styling
- Next.js App Router for routing
- **Registration system is ONLY for non-cohort events** (cohort_id IS NULL)
- Cohort-based events are managed separately and do not use this registration system

---

## Next Steps

1. Start with Phase 1 (Database Setup)
2. Move to Phase 2 (Backend API)
3. Build Phase 3 (Frontend Form)
4. Create Phase 4 (Event Pages)
5. Add Phase 5 enhancements as needed

**Estimated Timeline**: 
- Phase 1: 1-2 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- Phase 4: 2-3 hours
- Phase 5: 3-4 hours (optional)

**Total**: ~13-18 hours for core features, +3-4 hours for enhancements

