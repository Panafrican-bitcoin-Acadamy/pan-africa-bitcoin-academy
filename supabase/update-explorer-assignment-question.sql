-- Update the Explorer Scavenger Hunt assignment question
-- Run this in your Supabase SQL Editor to remove the extra instruction text

UPDATE assignments
SET question = 'Search for what this address belongs to: a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d'
WHERE title = 'Explorer Scavenger Hunt';

-- Verify the update
SELECT id, title, question FROM assignments WHERE title = 'Explorer Scavenger Hunt';
