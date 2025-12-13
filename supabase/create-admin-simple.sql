-- Simple SQL script to create/update an admin user
-- 
-- STEP 1: Generate password hash using Node.js (run in terminal):
--   node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(console.log)"
--
-- STEP 2: Replace YOUR_EMAIL and YOUR_HASH below, then run this SQL

-- Replace these values:
-- YOUR_EMAIL: your admin email address
-- YOUR_HASH: the bcrypt hash from step 1

INSERT INTO admins (email, password_hash, role)
VALUES (
  'YOUR_EMAIL',           -- Replace with your email (e.g., 'admin@example.com')
  'YOUR_HASH',            -- Replace with bcrypt hash from Node.js command
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Verify the admin was created
SELECT id, email, role, created_at, 
       CASE WHEN password_hash IS NOT NULL THEN 'Yes' ELSE 'No' END as has_password
FROM admins 
WHERE email = 'YOUR_EMAIL';  -- Replace with your email







