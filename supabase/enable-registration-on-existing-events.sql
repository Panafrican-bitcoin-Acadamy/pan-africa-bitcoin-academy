-- Enable registration on existing non-cohort events
-- This script helps you enable registration on events you already have
-- IMPORTANT: Only works for events where cohort_id IS NULL (non-cohort events)

-- Example 1: Enable registration on a specific event by ID
-- Replace 'YOUR_EVENT_ID_HERE' with the actual event UUID
/*
UPDATE events
SET 
  is_registration_enabled = true,
  location = 'Virtual (Zoom)',  -- Set your location
  event_date = start_time,       -- Use start_time as event_date if not set
  max_registrations = 50,        -- Optional: set max registrations
  registration_deadline = start_time - INTERVAL '1 day'  -- Optional: deadline 1 day before
WHERE id = 'YOUR_EVENT_ID_HERE'
  AND cohort_id IS NULL;  -- Only non-cohort events
*/

-- Example 2: Enable registration on all non-cohort workshop events
/*
UPDATE events
SET 
  is_registration_enabled = true,
  location = COALESCE(location, 'TBD'),  -- Set location if not already set
  event_date = COALESCE(event_date, start_time),  -- Use start_time if event_date not set
  max_registrations = 50
WHERE type = 'workshop'
  AND cohort_id IS NULL  -- Only non-cohort events
  AND is_registration_enabled = false;  -- Only update if not already enabled
*/

-- Example 3: Enable registration on all non-cohort community events
/*
UPDATE events
SET 
  is_registration_enabled = true,
  location = COALESCE(location, 'TBD'),
  event_date = COALESCE(event_date, start_time)
WHERE type = 'community'
  AND cohort_id IS NULL
  AND is_registration_enabled = false;
*/

-- View all non-cohort events that could have registration enabled
SELECT 
  id,
  name,
  type,
  start_time,
  cohort_id,
  is_registration_enabled,
  location,
  event_date,
  max_registrations
FROM events
WHERE cohort_id IS NULL  -- Only non-cohort events
ORDER BY start_time DESC;

-- View events that already have registration enabled
SELECT 
  id,
  name,
  type,
  start_time,
  location,
  event_date,
  max_registrations,
  registration_deadline
FROM events
WHERE is_registration_enabled = true
  AND cohort_id IS NULL
ORDER BY event_date ASC;

