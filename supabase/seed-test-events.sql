-- Seed test events with registration enabled
-- IMPORTANT: These are non-cohort events (cohort_id IS NULL)
-- Cohort-based events should NOT have registration enabled

-- Insert test events with registration enabled
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
  max_registrations,
  registration_deadline
) VALUES
(
  'Bitcoin Workshop: Introduction to Lightning Network',
  'workshop',
  'Learn the basics of the Lightning Network and how to use it for fast, low-cost Bitcoin transactions. This workshop is open to everyone interested in Bitcoin.',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
  'Virtual (Zoom)',
  NOW() + INTERVAL '7 days',
  NULL,  -- Non-cohort event (required for registration)
  true,  -- Registration enabled
  NULL,  -- No custom fields
  50,    -- Max 50 registrations
  NOW() + INTERVAL '6 days'  -- Registration deadline 1 day before event
),
(
  'Advanced Bitcoin Development Meetup',
  'workshop',
  'Deep dive into Bitcoin development for experienced developers. Topics include: Bitcoin Core, Lightning Network development, and building Bitcoin applications.',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days' + INTERVAL '4 hours',
  'Lagos, Nigeria',
  NOW() + INTERVAL '14 days',
  NULL,  -- Non-cohort event (required for registration)
  true,  -- Registration enabled
  '{
    "fields": [
      {
        "name": "company",
        "type": "text",
        "label": "Company Name",
        "required": true,
        "placeholder": "Enter your company name"
      },
      {
        "name": "experience_level",
        "type": "select",
        "label": "Experience Level",
        "required": true,
        "options": ["Beginner", "Intermediate", "Advanced"],
        "placeholder": "Select your experience level"
      },
      {
        "name": "github_username",
        "type": "text",
        "label": "GitHub Username",
        "required": false,
        "placeholder": "Optional: Your GitHub username"
      }
    ]
  }'::jsonb,
  30,    -- Max 30 registrations
  NOW() + INTERVAL '13 days'  -- Registration deadline 1 day before event
),
(
  'Bitcoin Community Meetup - Nairobi',
  'community',
  'Monthly Bitcoin community meetup in Nairobi. Network with other Bitcoin enthusiasts, share knowledge, and discuss the latest developments.',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days' + INTERVAL '2 hours',
  'Nairobi, Kenya',
  NOW() + INTERVAL '21 days',
  NULL,  -- Non-cohort event (required for registration)
  true,  -- Registration enabled
  NULL,  -- No custom fields
  NULL,  -- No max registrations limit
  NULL   -- No registration deadline
)
ON CONFLICT DO NOTHING;

-- Verify test events were created
SELECT 
  id,
  name,
  type,
  cohort_id,
  is_registration_enabled,
  location,
  event_date,
  max_registrations,
  registration_deadline,
  CASE 
    WHEN form_config IS NOT NULL THEN 'Has custom fields'
    ELSE 'No custom fields'
  END as form_status
FROM events
WHERE is_registration_enabled = true
ORDER BY event_date;

