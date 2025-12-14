// Test script to verify admin login
// Run with: node scripts/test-admin-login.js

const bcrypt = require('bcryptjs');

// Replace these with your actual values
const TEST_EMAIL = 'your-email@example.com';
const TEST_PASSWORD = 'your-password';

async function test() {
  console.log('Testing admin password hash...\n');
  
  // Generate a new hash
  console.log('1. Generating new password hash:');
  const hash = await bcrypt.hash(TEST_PASSWORD, 10);
  console.log('   Hash:', hash);
  console.log('   Length:', hash.length);
  console.log('   Starts with:', hash.substring(0, 7));
  
  // Test comparison
  console.log('\n2. Testing password comparison:');
  const match = await bcrypt.compare(TEST_PASSWORD, hash);
  console.log('   Password matches:', match);
  
  // Test wrong password
  const wrongMatch = await bcrypt.compare('wrong-password', hash);
  console.log('   Wrong password matches:', wrongMatch);
  
  console.log('\n3. SQL to create/update admin:');
  console.log(`INSERT INTO admins (email, password_hash, role)`);
  console.log(`VALUES ('${TEST_EMAIL.toLowerCase()}', '${hash}', 'admin')`);
  console.log(`ON CONFLICT (email) DO UPDATE`);
  console.log(`SET password_hash = EXCLUDED.password_hash,`);
  console.log(`    updated_at = NOW();`);
}

test().catch(console.error);








