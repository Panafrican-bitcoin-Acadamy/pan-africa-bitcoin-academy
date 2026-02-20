# Event Registration System - Quick Reference

## System Overview

**Goal**: Reusable event registration system where multiple events share the same form component, with optional dynamic fields per event.

**Key Principle**: Form is reusable, event is dynamic.

**⚠️ Important Constraint**: Registration system is **ONLY for non-cohort events** (events where `cohort_id IS NULL`). Cohort-based events are managed separately and do not use this registration system.

## Database Schema

### Events Table (Extended)
```sql
-- New columns added to existing events table
-- NOTE: Registration only works for non-cohort events (cohort_id IS NULL)
is_registration_enabled BOOLEAN DEFAULT false
location TEXT
event_date TIMESTAMP WITH TIME ZONE
form_config JSONB DEFAULT NULL  -- Dynamic form fields config
max_registrations INTEGER DEFAULT NULL
registration_deadline TIMESTAMP WITH TIME ZONE

-- Constraint: Registration can only be enabled for non-cohort events
CHECK (is_registration_enabled = false OR (is_registration_enabled = true AND cohort_id IS NULL))
```

### Registrations Table (New)
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  additional_data JSONB,  -- Custom field values
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, email)  -- Prevent duplicates
);
```

## API Endpoints

### POST `/api/events/[eventId]/register`
Register for an event. **Only works for non-cohort events** (cohort_id IS NULL).

**Request Body**:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "additional_data": {
    "company": "Acme Corp",
    "experience_level": "Advanced"
  }
}
```

**Response**:
```json
{
  "success": true,
  "registrationId": "uuid",
  "message": "Registration successful"
}
```

### GET `/api/events/[eventId]`
Get event details including form_config.

### GET `/api/events/[eventId]/registrations` (Admin)
Get all registrations for an event.

## Frontend Routes

- `/events` - Event list page (only shows non-cohort events with registration enabled)
- `/events/[id]` - Event details page (registration button only shown for non-cohort events)
- `/events/[id]/register` - Registration form page (returns error if event is cohort-based)

## Component: EventRegistrationForm

**Props**:
```typescript
{
  eventId: string;
  eventTitle?: string;
  formConfig?: FormConfig | null;
  onSuccess?: () => void;
}
```

**Form Config Example**:
```json
{
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
    }
  ]
}
```

## Validation Rules

- **Email**: Required, valid format, normalized to lowercase
- **Full Name**: Required, 2-100 characters, letters/spaces/hyphens only
- **Phone**: Optional, 7-15 digits
- **Custom Fields**: Validated based on form_config requirements

## Rate Limiting

- **Registration Endpoint**: 5 requests per 15 minutes per IP

## Security

- RLS enabled on registrations table (API only access)
- Input sanitization using existing utilities
- Server-side validation required
- Duplicate prevention (database constraint)
- Admin authentication for registration views
- **Cohort event protection**: Database constraint and API validation ensure registration only for non-cohort events

## Implementation Order

1. ✅ Database setup (migrations)
2. ✅ Backend API (registration endpoint)
3. ✅ Frontend form component
4. ✅ Event pages (list, detail, register)
5. ✅ Optional enhancements (email, admin view, CSV)

## Key Files to Create

```
supabase/
  add-event-registration-fields.sql
  create-event-registrations-table.sql
  seed-test-events.sql

src/app/api/events/[eventId]/register/route.ts
src/app/api/events/[eventId]/route.ts
src/app/api/events/[eventId]/registrations/route.ts

src/components/EventRegistrationForm.tsx

src/app/events/page.tsx
src/app/events/[id]/page.tsx
src/app/events/[id]/register/page.tsx
```

## Testing Checklist

- [ ] Register with base fields only
- [ ] Register with custom fields
- [ ] Duplicate email prevention
- [ ] Max registrations limit
- [ ] Rate limiting
- [ ] Form validation
- [ ] Loading/success states
- [ ] Admin registration view
- [ ] CSV export (if implemented)

