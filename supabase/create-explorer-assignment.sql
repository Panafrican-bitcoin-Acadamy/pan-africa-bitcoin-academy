-- Create the Explorer Scavenger Hunt assignment
-- Run this in your Supabase SQL Editor after running add-assignments-tables.sql

-- Insert the Explorer Scavenger Hunt assignment
-- Note: Replace 'admin@example.com' with an actual admin email from your admins table
INSERT INTO assignments (
  title,
  description,
  question,
  search_address,
  correct_answer,
  chapter_number,
  chapter_slug,
  points,
  status,
  cohort_id
) VALUES (
  'Explorer Scavenger Hunt',
  'Practice using block explorers to find information about Bitcoin transactions',
  'Search for what this address belongs to: a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d',
  'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d',
  'Bitcoin Pizza day',
  13,
  'verify-for-yourself-block-explorers-nodes',
  10,
  'active',
  NULL -- NULL means assignment is for all cohorts
);

-- Verify the assignment was created
SELECT * FROM assignments WHERE title = 'Explorer Scavenger Hunt';
