# Database Alignment Verification: Blog & Sats Rewards

## ✅ Verification Checklist

### 1. blog_submissions Table
**Required Columns:**
- ✅ `id` (UUID, PRIMARY KEY)
- ✅ `author_id` (UUID, REFERENCES profiles(id)) → Maps to sats_rewards.student_id
- ✅ `author_email` (TEXT) → Used to find profile if author_id missing
- ✅ `title` (TEXT) → Used in sats_rewards.reason
- ✅ `status` (TEXT: 'pending', 'approved', 'rejected')
- ✅ `reviewed_at` (TIMESTAMP) → Set when approved
- ✅ `reviewed_by` (UUID) → Admin who approved
- ⚠️ `rejection_reason` (TEXT) → **MISSING FROM SCHEMA** (needs to be added)

**Action Required:** Run `supabase/add-blog-rejection-reason.sql` to add missing column.

### 2. blog_posts Table
**Required Columns:**
- ✅ `id` (UUID, PRIMARY KEY) → Maps to sats_rewards.related_entity_id
- ✅ `author_id` (UUID, REFERENCES profiles(id)) → Should match sats_rewards.student_id
- ✅ `title` (TEXT) → Used in sats_rewards.reason
- ✅ `status` (TEXT: 'draft', 'published', 'archived')
- ✅ `published_at` (TIMESTAMP) → Set when approved
- ✅ All other fields properly mapped from submission

### 3. sats_rewards Table
**Required Columns for Blog Rewards:**
- ✅ `id` (UUID, PRIMARY KEY) - Auto-generated
- ✅ `student_id` (UUID, REFERENCES profiles(id)) - **MUST EXIST** in profiles table
- ✅ `amount_paid` (INTEGER, DEFAULT 0) - Set to 0
- ✅ `amount_pending` (INTEGER, DEFAULT 0) - Set to 2000
- ✅ `reason` (TEXT) - "Blog post approved: [title]"
- ✅ `status` (TEXT: 'pending', 'processing', 'paid', 'failed') - Set to 'pending'
- ✅ `payment_date` (TIMESTAMP) - NULL initially (optional)
- ✅ `awarded_by` (UUID, REFERENCES profiles(id)) - Admin ID (optional)
- ✅ `reward_type` (TEXT) - **MUST BE 'blog'** (CHECK constraint)
- ✅ `related_entity_type` (TEXT) - **MUST BE 'blog'** (CHECK constraint)
- ✅ `related_entity_id` (UUID) - **MUST BE** blog_posts.id
- ✅ `created_at` (TIMESTAMP, DEFAULT NOW()) - Auto-generated
- ✅ `updated_at` (TIMESTAMP, DEFAULT NOW()) - Auto-generated

## Data Flow Verification

### When Approve Button is Clicked:

1. **blog_submissions** update:
   ```sql
   UPDATE blog_submissions SET
     status = 'approved',
     reviewed_at = NOW(),
     reviewed_by = [admin_id]
   WHERE id = [submission_id]
   ```

2. **blog_posts** insert:
   ```sql
   INSERT INTO blog_posts (
     title, slug, author_id, author_name, author_role,
     author_bio, category, excerpt, content,
     status, published_at
   ) VALUES (...)
   ```

3. **sats_rewards** insert:
   ```sql
   INSERT INTO sats_rewards (
     student_id,           -- From submission.author_id
     amount_paid,          -- 0
     amount_pending,       -- 2000
     reward_type,          -- 'blog'
     related_entity_type,  -- 'blog'
     related_entity_id,    -- blog_posts.id
     reason,               -- "Blog post approved: [title]"
     status,               -- 'pending'
     awarded_by            -- admin_id (optional)
   ) VALUES (...)
   ```

## Critical Alignment Points

### ✅ student_id Alignment
- `blog_submissions.author_id` → `sats_rewards.student_id`
- `blog_posts.author_id` → `sats_rewards.student_id`
- **All must reference existing profiles(id)**

### ✅ related_entity_id Alignment
- `blog_posts.id` → `sats_rewards.related_entity_id`
- **Used to link reward to specific blog post**

### ✅ CHECK Constraint Values
- `reward_type`: **'blog'** (lowercase, exact match)
- `related_entity_type`: **'blog'** (lowercase, exact match)
- `status`: **'pending'** (lowercase, exact match)

## Potential Issues & Solutions

### Issue 1: Missing rejection_reason Column
**Problem:** Code tries to update `rejection_reason` but column doesn't exist
**Solution:** Run migration script `supabase/add-blog-rejection-reason.sql`

### Issue 2: Profile Not Found
**Problem:** `author_id` doesn't exist in profiles table
**Solution:** Code already handles this by:
- Verifying profile exists before creating reward
- Falling back to email lookup
- Providing clear error messages

### Issue 3: CHECK Constraint Violation
**Problem:** Values don't match CHECK constraints exactly
**Solution:** Code uses `as const` and validates against valid values

### Issue 4: Duplicate Rewards
**Problem:** Multiple rewards for same blog post
**Solution:** Code checks for existing reward before inserting

## Testing Checklist

- [ ] Approve button creates blog_post record
- [ ] Approve button updates blog_submission status to 'approved'
- [ ] Approve button creates sats_reward record
- [ ] sats_reward.student_id matches blog_post.author_id
- [ ] sats_reward.related_entity_id matches blog_post.id
- [ ] sats_reward.reward_type = 'blog'
- [ ] sats_reward.related_entity_type = 'blog'
- [ ] sats_reward.status = 'pending'
- [ ] sats_reward.amount_pending = 2000
- [ ] No duplicate rewards created for same blog post

