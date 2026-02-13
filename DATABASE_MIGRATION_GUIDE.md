# Database Migration Guide

## Blog Submissions - Rejection Reason Column

### Issue
The `rejection_reason` column is missing from the `blog_submissions` table. This column is required for storing the reason when an admin rejects a blog submission.

### Solution
Run the migration script to add the missing column.

### Migration Script
**File:** `supabase/add-blog-rejection-reason.sql`

### Steps to Apply Migration

1. **Open Supabase Dashboard**
   - Navigate to your Supabase project
   - Go to SQL Editor

2. **Run the Migration Script**
   ```sql
   -- Copy and paste the contents of supabase/add-blog-rejection-reason.sql
   -- Or run it directly from the file
   ```

3. **Verify the Migration**
   ```sql
   -- Check if the column exists
   SELECT column_name, data_type, character_maximum_length
   FROM information_schema.columns
   WHERE table_name = 'blog_submissions'
   AND column_name = 'rejection_reason';
   ```

### What the Script Does

- Adds `rejection_reason TEXT` column to `blog_submissions` table
- Column is nullable (allows NULL for submissions that haven't been rejected)
- Maximum recommended length: 1000 characters (enforced at application level)
- Adds documentation comment to the column

### API Integration

The API route `/api/admin/blog/reject` has been updated to:
- ✅ Validate submission ID format (UUID)
- ✅ Sanitize rejection reason input (max 1000 characters)
- ✅ Log rejection actions for audit purposes
- ✅ Store rejection reason in the database

### Testing

After running the migration:

1. **Test Rejection with Reason**
   ```bash
   POST /api/admin/blog/reject
   {
     "submissionId": "uuid-here",
     "rejectionReason": "Content does not meet quality standards"
   }
   ```

2. **Verify in Database**
   ```sql
   SELECT id, status, rejection_reason, reviewed_at
   FROM blog_submissions
   WHERE status = 'rejected'
   ORDER BY reviewed_at DESC
   LIMIT 10;
   ```

### Rollback (if needed)

If you need to remove the column:

```sql
ALTER TABLE blog_submissions 
DROP COLUMN IF EXISTS rejection_reason;
```

**Note:** This will permanently delete all rejection reasons. Only use if absolutely necessary.

---

## Other Pending Migrations

Check the `supabase/` directory for other migration scripts that may need to be applied.

