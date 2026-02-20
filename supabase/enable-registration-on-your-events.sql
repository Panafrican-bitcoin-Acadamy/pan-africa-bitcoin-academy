-- Enable registration on your existing events
-- This will enable registration on events that are "For Everyone" (cohort_id IS NULL)

-- Step 1: Check your existing events
SELECT 
  id,
  name,
  type,
  cohort_id,
  is_registration_enabled,
  location,
  start_time
FROM events
WHERE cohort_id IS NULL  -- Only non-cohort events
ORDER BY start_time DESC;

-- Step 2: Enable registration on a specific event by name
-- Replace 'Bitcoin and scams / ቢትኮይንን ስካምን' with your actual event name
UPDATE events
SET 
  is_registration_enabled = true,
  location = COALESCE(location, 'TBD'),  -- Set location if not already set
  event_date = COALESCE(event_date, start_time)  -- Use start_time if event_date not set
WHERE name LIKE '%Bitcoin and scams%'  -- Match your event name
  AND cohort_id IS NULL  -- Only non-cohort events
  AND is_registration_enabled = false;  -- Only update if not already enabled

-- Step 3: Enable registration on ALL your non-cohort events (if you want)
-- Uncomment the lines below if you want to enable registration on all non-cohort events:
/*
UPDATE events
SET 
  is_registration_enabled = true,
  location = COALESCE(location, 'TBD'),
  event_date = COALESCE(event_date, start_time)
WHERE cohort_id IS NULL
  AND is_registration_enabled = false;
*/

-- Step 4: Verify the update
SELECT 
  id,
  name,
  type,
  cohort_id,
  is_registration_enabled,
  location,
  event_date,
  max_registrations,
  registration_deadline
FROM events
WHERE name LIKE '%Bitcoin and scams%'
  AND cohort_id IS NULL;

