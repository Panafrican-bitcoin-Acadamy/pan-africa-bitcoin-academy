-- Helper script to create an admin user
-- Replace 'your-email@example.com' and 'YOUR_BCRYPT_HASH' with actual values
-- 
-- To generate bcrypt hash, run in Node.js:
-- node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(console.log)"

INSERT INTO admins (email, password_hash, role)
VALUES (
  'your-email@example.com',  -- Replace with your email
  'YOUR_BCRYPT_HASH',         -- Replace with bcrypt hash from Node.js command above
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Verify the admin was created
SELECT id, email, role, created_at FROM admins WHERE email = 'your-email@example.com';







