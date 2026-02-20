# Event Registration - URLs and Setup for Existing Events

## Registration Form URLs

Once the system is implemented, the registration form URLs will be:

### Registration Form Page
```
/events/[eventId]/register
```

**Example:**
- If your event ID is `123e4567-e89b-12d3-a456-426614174000`
- The registration URL will be: `/events/123e4567-e89b-12d3-a456-426614174000/register`

### Event Details Page (with Register button)
```
/events/[eventId]
```

**Example:**
- Event details: `/events/123e4567-e89b-12d3-a456-426614174000`
- This page will show event details and a "Register" button that links to the registration form

### Events List Page
```
/events
```

**Example:**
- Lists all events with registration enabled (non-cohort events only)
- Each event card links to `/events/[eventId]`

---

## Enabling Registration on Existing Events

Since you already have events, you don't need to create new ones. Just enable registration on the events you want.

### Step 1: Find Your Event IDs

Run this query in Supabase SQL Editor to see all your non-cohort events:

```sql
SELECT 
  id,
  name,
  type,
  start_time,
  cohort_id,
  is_registration_enabled
FROM events
WHERE cohort_id IS NULL  -- Only non-cohort events can have registration
ORDER BY start_time DESC;
```

### Step 2: Enable Registration on Specific Events

**Option A: Enable on a single event by ID**

```sql
UPDATE events
SET 
  is_registration_enabled = true,
  location = 'Your Location Here',  -- Set the location
  event_date = start_time,            -- Use start_time as event_date
  max_registrations = 50,             -- Optional: set max registrations
  registration_deadline = start_time - INTERVAL '1 day'  -- Optional: deadline
WHERE id = 'YOUR_EVENT_ID_HERE'       -- Replace with actual event UUID
  AND cohort_id IS NULL;              -- Safety check: only non-cohort events
```

**Option B: Enable on multiple events by type**

```sql
-- Enable registration on all non-cohort workshop events
UPDATE events
SET 
  is_registration_enabled = true,
  location = COALESCE(location, 'TBD'),
  event_date = COALESCE(event_date, start_time),
  max_registrations = 50
WHERE type = 'workshop'
  AND cohort_id IS NULL
  AND is_registration_enabled = false;
```

**Option C: Enable on all non-cohort community events**

```sql
UPDATE events
SET 
  is_registration_enabled = true,
  location = COALESCE(location, 'TBD'),
  event_date = COALESCE(event_date, start_time)
WHERE type = 'community'
  AND cohort_id IS NULL
  AND is_registration_enabled = false;
```

### Step 3: Verify Registration is Enabled

```sql
SELECT 
  id,
  name,
  type,
  start_time,
  location,
  event_date,
  is_registration_enabled,
  max_registrations,
  registration_deadline
FROM events
WHERE is_registration_enabled = true
  AND cohort_id IS NULL
ORDER BY event_date ASC;
```

---

## Full URL Examples

Once implemented, here's how the URLs work:

### Example Event Flow:

1. **User visits events list:**
   ```
   https://panafricanbitcoin.com/events
   ```
   - Shows all events with registration enabled

2. **User clicks on an event:**
   ```
   https://panafricanbitcoin.com/events/123e4567-e89b-12d3-a456-426614174000
   ```
   - Shows event details
   - Shows "Register" button (if registration enabled)

3. **User clicks Register button:**
   ```
   https://panafricanbitcoin.com/events/123e4567-e89b-12d3-a456-426614174000/register
   ```
   - Shows registration form
   - User fills out form and submits

---

## Quick Reference: SQL Helper File

I've created a helper SQL file: `supabase/enable-registration-on-existing-events.sql`

This file contains:
- Examples for enabling registration on single events
- Examples for enabling registration on multiple events
- Queries to view events that can have registration
- Queries to view events with registration already enabled

---

## Important Notes

1. **Only Non-Cohort Events**: Registration can only be enabled on events where `cohort_id IS NULL`
2. **Database Constraint**: The database will prevent you from enabling registration on cohort events
3. **Required Fields**: When enabling registration, you should set:
   - `location` (where the event is)
   - `event_date` (when the event is - can use `start_time`)
4. **Optional Fields**:
   - `max_registrations` (limit number of registrations)
   - `registration_deadline` (when registration closes)
   - `form_config` (custom form fields - see execution plan for format)

---

## Next Steps

1. ✅ Run database migrations (if not done):
   - `supabase/add-event-registration-fields.sql`
   - `supabase/create-event-registrations-table.sql`

2. ✅ Enable registration on your existing events (use SQL above)

3. ⏭️ Implement the backend API (Phase 2)

4. ⏭️ Implement the frontend pages (Phase 4)

5. ⏭️ Test the registration flow

See `EVENT_REGISTRATION_EXECUTION_PLAN.md` for full implementation details.

