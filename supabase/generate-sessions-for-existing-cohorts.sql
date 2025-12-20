-- Generate sessions for all existing cohorts that have start_date and end_date
-- This script will create sessions for cohorts that were created before the session generation feature

-- First, let's see which cohorts need sessions
-- Run this to check:
-- SELECT id, name, start_date, end_date, sessions 
-- FROM cohorts 
-- WHERE start_date IS NOT NULL 
--   AND end_date IS NOT NULL
--   AND (sessions = 0 OR sessions IS NULL);

-- Note: This is a reference script. The actual session generation should be done via the API
-- endpoint POST /api/cohorts/generate-sessions with { cohortId: 'uuid' }
-- Or use the regenerateSessions function in the admin panel

-- To generate sessions for a specific cohort via SQL (if needed):
-- You would need to call the session generation logic, which is best done via the API
-- But here's a helper function approach:

-- This function calculates session dates (3 per week, excluding Sundays)
CREATE OR REPLACE FUNCTION generate_sessions_for_cohort(cohort_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  cohort_start DATE;
  cohort_end DATE;
  current_date DATE;
  session_num INTEGER := 1;
  sessions_this_week INTEGER := 0;
  week_start DATE;
  day_of_week INTEGER;
  days_from_monday INTEGER;
  sessions_created INTEGER := 0;
BEGIN
  -- Get cohort dates
  SELECT start_date, end_date INTO cohort_start, cohort_end
  FROM cohorts
  WHERE id = cohort_uuid;
  
  IF cohort_start IS NULL OR cohort_end IS NULL THEN
    RAISE EXCEPTION 'Cohort must have start_date and end_date';
  END IF;
  
  -- Delete existing sessions for this cohort
  DELETE FROM cohort_sessions WHERE cohort_id = cohort_uuid;
  
  -- Start from cohort start date
  current_date := cohort_start;
  week_start := NULL;
  
  WHILE current_date <= cohort_end LOOP
    day_of_week := EXTRACT(DOW FROM current_date); -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    -- Skip Sundays (day 0)
    IF day_of_week != 0 THEN
      -- Calculate Monday of current week
      days_from_monday := CASE 
        WHEN day_of_week = 0 THEN 6  -- Sunday
        ELSE day_of_week - 1          -- Monday = 0, Tuesday = 1, etc.
      END;
      
      -- Get the Monday of this week
      week_start := current_date - (days_from_monday || ' days')::INTERVAL;
      
      -- Check if we've moved to a new week
      IF week_start IS NULL OR week_start != (current_date - (days_from_monday || ' days')::INTERVAL) THEN
        sessions_this_week := 0;
      END IF;
      
      -- Add session if we haven't reached 3 sessions this week
      IF sessions_this_week < 3 THEN
        INSERT INTO cohort_sessions (
          cohort_id,
          session_date,
          session_number,
          status
        ) VALUES (
          cohort_uuid,
          current_date,
          session_num,
          'scheduled'
        );
        
        session_num := session_num + 1;
        sessions_this_week := sessions_this_week + 1;
        sessions_created := sessions_created + 1;
      END IF;
    END IF;
    
    -- Move to next day
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Update cohort sessions count
  UPDATE cohorts 
  SET sessions = sessions_created 
  WHERE id = cohort_uuid;
  
  RETURN sessions_created;
END;
$$ LANGUAGE plpgsql;

-- To generate sessions for all cohorts that need them:
-- DO $$
-- DECLARE
--   cohort_rec RECORD;
--   sessions_count INTEGER;
-- BEGIN
--   FOR cohort_rec IN 
--     SELECT id, name, start_date, end_date 
--     FROM cohorts 
--     WHERE start_date IS NOT NULL 
--       AND end_date IS NOT NULL
--   LOOP
--     BEGIN
--       sessions_count := generate_sessions_for_cohort(cohort_rec.id);
--       RAISE NOTICE 'Generated % sessions for cohort: %', sessions_count, cohort_rec.name;
--     EXCEPTION WHEN OTHERS THEN
--       RAISE NOTICE 'Error generating sessions for cohort %: %', cohort_rec.name, SQLERRM;
--     END;
--   END LOOP;
-- END $$;

-- Note: It's recommended to use the API endpoint instead for better error handling
-- POST /api/cohorts/generate-sessions with { cohortId: 'uuid' } for each cohort
