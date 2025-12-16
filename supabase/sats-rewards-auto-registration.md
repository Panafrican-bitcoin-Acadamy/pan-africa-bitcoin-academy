# Sats Rewards Auto-Registration

## Overview
When a student is created, a sats_rewards record is automatically created with all values set to zero/defaults. This ensures every student has a record in the sats_rewards table.

## Implementation

### Function: `create_sats_rewards_for_student()`
- **Trigger**: After INSERT on `students` table
- **Action**: Creates a sats_rewards record with:
  - `student_id` = `NEW.profile_id`
  - `amount_paid` = 0
  - `amount_pending` = 0
  - `status` = 'pending'
  - `reward_type` = 'other'
  - `created_at` = NOW()
  - `updated_at` = NOW()

### Safety Features
- Uses `ON CONFLICT DO NOTHING` to prevent duplicate records
- Only creates record if student record is successfully created
- All other fields remain NULL or default values until updated

## Usage

When a student is created (via application approval or direct insert):
1. Student record is created in `students` table
2. Trigger fires automatically
3. Initial sats_rewards record is created with zeros
4. Admin can later award sats by updating this record or creating new records

## Notes

- The initial record has zeros, so it won't affect sats totals
- Multiple reward records per student are still supported
- The API sums all records, so the zero record doesn't affect calculations
- This ensures every student has at least one sats_rewards record for tracking
