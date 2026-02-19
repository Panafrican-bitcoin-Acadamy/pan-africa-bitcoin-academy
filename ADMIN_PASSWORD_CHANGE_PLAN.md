# Admin Password Change System - Implementation Plan

## Overview
Remove email verification requirement for admins and implement a password change system for new admins who receive temporary passwords.

## Requirements

### 1. Remove Email Verification
- Remove email verification check from login
- Remove email verification UI from login form
- Keep email verification endpoints (for future use if needed)
- Update database: Set all existing admins to `email_verified = true` or remove the requirement

### 2. Add Password Change System

#### Database Changes
- Add `password_changed_at` column to `admins` table (timestamp)
- Add `temporary_password` column (boolean) or use `password_changed_at IS NULL` to detect
- Add `force_password_change` column (boolean) - set to true for new admins

#### Admin Registration Flow
1. Admin creates new admin account via admin panel
2. System generates temporary password (or admin sets one)
3. New admin account has:
   - `password_hash` = hashed temporary password
   - `force_password_change` = true
   - `password_changed_at` = NULL

#### Login Flow Changes
1. User logs in with temporary password
2. System checks if `force_password_change = true` or `password_changed_at IS NULL`
3. If true, redirect to password change page (don't allow access to dashboard)
4. User must change password before accessing admin panel

#### Password Change Page
- Route: `/admin/change-password` or `/admin/setup-password`
- Requires valid session (logged in with temporary password)
- Form fields:
  - Current password (temporary password)
  - New password
  - Confirm new password
- Validation:
  - New password must meet requirements (8+ chars, etc.)
  - New password must be different from current
  - Confirm password must match
- After successful change:
  - Update `password_hash`
  - Set `force_password_change` = false
  - Set `password_changed_at` = NOW()
  - Redirect to admin dashboard

#### Admin Panel - Create Admin
- Add form to create new admin accounts
- Fields:
  - Email
  - Role (optional)
  - Temporary password (or auto-generate)
- On creation:
  - Hash temporary password
  - Set `force_password_change` = true
  - Set `email_verified` = true (no verification needed)
  - Send email with temporary password (optional)

## Implementation Steps

### Step 1: Database Migration
- Remove email verification requirement (set all to verified)
- Add `password_changed_at` column
- Add `force_password_change` column

### Step 2: Update Login API
- Remove email verification check
- Add check for `force_password_change`
- If true, return special response indicating password change required

### Step 3: Create Password Change API
- POST `/api/admin/change-password`
- Verify current password
- Validate new password
- Update password and flags

### Step 4: Create Password Change Page
- Create `/admin/change-password` page
- Show form for password change
- Handle redirect from login

### Step 5: Update Login Form
- Remove email verification UI
- Handle password change required response
- Redirect to password change page

### Step 6: Add Admin Creation Form (Optional)
- Add form in admin panel to create new admins
- Generate temporary passwords
- Send email with credentials

## Security Considerations
- Temporary passwords should be strong (auto-generated)
- Password change should require current password verification
- Session should be valid but limited until password is changed
- Log password change events

## Files to Modify/Create

### Modify:
1. `src/app/api/admin/login/route.ts` - Remove email verification, add password change check
2. `src/app/admin/page.tsx` - Remove verification UI, add password change redirect
3. `supabase/add-admin-security-features.sql` - Add password change columns

### Create:
1. `src/app/admin/change-password/page.tsx` - Password change page
2. `src/app/api/admin/change-password/route.ts` - Password change API
3. `supabase/add-admin-password-change.sql` - Migration for password change columns

### Optional:
1. `src/app/api/admin/create/route.ts` - Create new admin endpoint
2. `src/components/admin/CreateAdminForm.tsx` - Admin creation form component

