# Database Alignment: Blog Posts, Blog Submissions, and Sats Rewards

## Database Schema Alignment

### blog_submissions Table
- `id` (UUID, PRIMARY KEY) → Used to identify submission
- `author_id` (UUID, REFERENCES profiles(id)) → Maps to `sats_rewards.student_id`
- `author_email` (TEXT) → Used to find profile if author_id is missing
- `title` (TEXT) → Used in sats_rewards.reason
- `status` (TEXT: 'pending', 'approved', 'rejected') → Updated to 'approved' when approved
- `reviewed_at` (TIMESTAMP) → Set when approved
- `reviewed_by` (UUID) → Admin who approved

### blog_posts Table
- `id` (UUID, PRIMARY KEY) → Maps to `sats_rewards.related_entity_id`
- `author_id` (UUID, REFERENCES profiles(id)) → Should match `sats_rewards.student_id`
- `title` (TEXT) → Used in sats_rewards.reason
- `status` (TEXT: 'draft', 'published', 'archived') → Set to 'published' when approved
- `published_at` (TIMESTAMP) → Set when approved

### sats_rewards Table
- `id` (UUID, PRIMARY KEY)
- `student_id` (UUID, REFERENCES profiles(id)) → **MUST MATCH** blog_submissions.author_id or blog_posts.author_id
- `amount_paid` (INTEGER, DEFAULT 0) → Set to 0 initially
- `amount_pending` (INTEGER, DEFAULT 0) → Set to 2000 for blog posts
- `reason` (TEXT) → "Blog post approved: [title]"
- `status` (TEXT: 'pending', 'processing', 'paid', 'failed') → Set to 'pending'
- `payment_date` (TIMESTAMP) → NULL initially
- `awarded_by` (UUID, REFERENCES profiles(id)) → Admin who approved (optional)
- `reward_type` (TEXT: 'assignment', 'chapter', 'discussion', 'peer_help', 'project', 'attendance', **'blog'**, 'other') → **MUST BE 'blog'**
- `related_entity_type` (TEXT: 'assignment', 'chapter', 'event', 'discussion', 'project', **'blog'**, 'other') → **MUST BE 'blog'**
- `related_entity_id` (UUID) → **MUST BE** blog_posts.id
- `created_at` (TIMESTAMP, DEFAULT NOW())
- `updated_at` (TIMESTAMP, DEFAULT NOW())

## Data Flow When Approve Button is Clicked

1. **Blog Submission** (blog_submissions table):
   - Status: 'pending' → 'approved'
   - reviewed_at: Set to current timestamp
   - reviewed_by: Set to admin ID

2. **Blog Post** (blog_posts table):
   - New record created with:
     - title, content, author_id, etc. from submission
     - status: 'published'
     - published_at: Set to current timestamp
   - Returns: blogPost.id (used for related_entity_id)

3. **Sats Reward** (sats_rewards table):
   - New record created with:
     - student_id: From submission.author_id or found via email
     - amount_paid: 0
     - amount_pending: 2000
     - reward_type: 'blog'
     - related_entity_type: 'blog'
     - related_entity_id: blogPost.id
     - reason: "Blog post approved: [title]"
     - status: 'pending'
     - awarded_by: Admin ID (optional)

## Required Alignments

✅ **student_id alignment**: 
   - blog_submissions.author_id → sats_rewards.student_id
   - blog_posts.author_id → sats_rewards.student_id
   - All reference profiles(id)

✅ **related_entity_id alignment**:
   - blog_posts.id → sats_rewards.related_entity_id
   - Used to link reward to specific blog post

✅ **CHECK constraint values**:
   - reward_type: 'blog' ✓
   - related_entity_type: 'blog' ✓
   - status: 'pending' ✓

✅ **Foreign key relationships**:
   - student_id → profiles(id) ✓
   - awarded_by → profiles(id) ✓
   - related_entity_id → No FK constraint (UUID only) ✓

## Potential Issues to Check

1. **Missing profile**: If author_id doesn't exist in profiles table, foreign key will fail
2. **Invalid UUID format**: related_entity_id must be valid UUID
3. **CHECK constraint violation**: Values must match exactly (case-sensitive)
4. **Duplicate rewards**: Check prevents duplicate rewards for same blog post

