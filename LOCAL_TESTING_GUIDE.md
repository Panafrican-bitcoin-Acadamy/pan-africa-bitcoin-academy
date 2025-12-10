# Local Testing Guide - Authentication System

## Prerequisites

1. ✅ Development server should be running on `http://localhost:3000`
2. ✅ Supabase environment variables configured in `.env.local`
3. ✅ Database schema with `password_hash` column (run migration if needed)

## Step-by-Step Testing

### 1. Test User Registration

**Steps:**
1. Open `http://localhost:3000` in your browser
2. Click "Sign In" button in the navbar
3. Click "Sign Up" to switch to registration mode
4. Fill in the form:
   - **Full Name**: Test User
   - **Email**: test@example.com
   - **Password**: testpass123 (minimum 6 characters)
   - **Confirm Password**: testpass123
5. Click "Create Account"

**Expected Results:**
- ✅ Account created successfully
- ✅ Redirected to dashboard or page reloads
- ✅ Navbar shows user profile
- ✅ Email stored in localStorage

**Check Database:**
- Go to Supabase Dashboard → Table Editor → profiles
- Verify new profile exists
- Verify `password_hash` is a bcrypt hash (starts with `$2a$` or `$2b$`)

### 2. Test User Login

**Steps:**
1. Click "Logout" if already logged in
2. Click "Sign In" button
3. Enter credentials:
   - **Email**: test@example.com
   - **Password**: testpass123
4. Click "Sign In"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to `/dashboard`
- ✅ Profile information displayed
- ✅ No error messages

### 3. Test Invalid Login

**Steps:**
1. Click "Sign In"
2. Enter wrong password:
   - **Email**: test@example.com
   - **Password**: wrongpassword
3. Click "Sign In"

**Expected Results:**
- ❌ Error message: "Invalid email or password"
- ❌ Not redirected
- ❌ Remains on login modal

### 4. Test Non-Existent User

**Steps:**
1. Click "Sign In"
2. Enter non-existent email:
   - **Email**: nonexistent@example.com
   - **Password**: anypassword
3. Click "Sign In"

**Expected Results:**
- ❌ Error message: "Invalid email or password"
- ❌ Security: Doesn't reveal if email exists

### 5. Test Session Persistence

**Steps:**
1. Login successfully
2. Refresh the page (F5)
3. Navigate to different pages
4. Close and reopen browser tab

**Expected Results:**
- ✅ Still logged in after refresh
- ✅ Profile information persists
- ✅ Can access protected routes (dashboard)

### 6. Test Logout

**Steps:**
1. While logged in, click user profile dropdown
2. Click "Logout"

**Expected Results:**
- ✅ Redirected to home page
- ✅ localStorage cleared
- ✅ Navbar shows "Sign In" button
- ✅ Cannot access `/dashboard` (redirects to home)

### 7. Test Password Validation

**Registration Tests:**

**Test 7a: Short Password**
- Password: `12345` (less than 6 characters)
- Expected: Error message about minimum length

**Test 7b: Password Mismatch**
- Password: `testpass123`
- Confirm: `differentpass`
- Expected: Error "Passwords do not match"

**Test 7c: Missing Fields**
- Leave email or name empty
- Expected: Validation error messages

### 8. Test Protected Routes

**Steps:**
1. Logout if logged in
2. Try to access `http://localhost:3000/dashboard` directly

**Expected Results:**
- ✅ Redirected to home page (`/`)
- ✅ Cannot access dashboard without authentication

### 9. Test Cross-Tab Authentication

**Steps:**
1. Login in one browser tab
2. Open same site in another tab
3. Logout in one tab

**Expected Results:**
- ✅ Both tabs reflect login state
- ✅ Logout in one tab logs out in both (or triggers update)

### 10. Test Legacy Password Migration

**If you have existing users with old password format:**

**Steps:**
1. Create a test user with old password format in database:
   ```sql
   UPDATE profiles 
   SET password_hash = 'hashed_oldpassword' 
   WHERE email = 'test@example.com';
   ```
2. Try to login with password: `oldpassword`
3. Check database after login

**Expected Results:**
- ✅ Login succeeds
- ✅ Password hash automatically updated to bcrypt format
- ✅ Future logins use new hash

## Browser Console Checks

Open browser DevTools (F12) and check:

1. **Network Tab:**
   - `/api/profile/register` - Should return `{ success: true }`
   - `/api/profile/login` - Should return `{ found: true, success: true, profile: {...} }`
   - `/api/profile/verify-session` - Should return `{ valid: true, profile: {...} }`

2. **Console Tab:**
   - No authentication errors
   - No CORS errors
   - No Supabase connection errors

3. **Application Tab → Local Storage:**
   - `profileEmail` should contain user email when logged in
   - Should be cleared on logout

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** Check `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Password hash column doesn't exist"
**Solution:** Run migration script:
```sql
-- In Supabase SQL Editor
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

### Issue: "Cannot login after registration"
**Solution:** 
- Check database for profile creation
- Verify password_hash was created
- Check browser console for errors

### Issue: "Session not persisting"
**Solution:**
- Check localStorage is enabled
- Verify `/api/profile/verify-session` endpoint works
- Check browser console for errors

## API Endpoint Testing (Optional)

You can also test endpoints directly using curl or Postman:

### Register:
```bash
curl -X POST http://localhost:3000/api/profile/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test2@example.com","password":"testpass123"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/profile/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"testpass123"}'
```

### Verify Session:
```bash
curl -X POST http://localhost:3000/api/profile/verify-session \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com"}'
```

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Passwords are hashed with bcrypt
✅ Login requires password
✅ Session persists across page refreshes
✅ Protected routes work correctly
✅ Logout clears session

## Next Steps After Testing

1. Test with multiple users
2. Test edge cases (very long passwords, special characters)
3. Test on different browsers
4. Test mobile responsiveness
5. Deploy to staging/production

