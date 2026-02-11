-- ============================================
-- Database Relationships & Efficiency Fixes
-- Add missing indexes for foreign keys and query optimization
-- ============================================

-- High Priority: Missing Foreign Key Indexes
-- These are frequently queried and will significantly improve performance

-- Index for profiles.cohort_id (used in many admin queries)
CREATE INDEX IF NOT EXISTS idx_profiles_cohort_id ON profiles(cohort_id);

-- Index for applications.preferred_cohort_id (used in admin dashboard)
CREATE INDEX IF NOT EXISTS idx_applications_cohort_id ON applications(preferred_cohort_id);

-- Medium Priority: Missing Foreign Key Indexes (Nullable)
-- These are used in admin queries but less frequently

-- Index for blog_submissions.reviewed_by (used in admin queries)
CREATE INDEX IF NOT EXISTS idx_blog_submissions_reviewed_by ON blog_submissions(reviewed_by);

-- Index for assignments.created_by (used in admin queries)
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);

-- Index for assignment_submissions.graded_by (used in admin queries)
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded_by ON assignment_submissions(graded_by);

-- Index for exam_access.granted_by (used in admin queries)
CREATE INDEX IF NOT EXISTS idx_exam_access_granted_by ON exam_access(granted_by);

-- Composite Indexes for Better Query Performance
-- These optimize common query patterns

-- Composite index for blog submissions filtered by status and sorted by created_at
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status_created ON blog_submissions(status, created_at DESC);

-- Composite index for assignment submissions filtered by assignment and status
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_status ON assignment_submissions(assignment_id, status);

-- Optional: Status Indexes (if frequently filtered)
-- Uncomment these if you frequently filter by status

-- CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
-- CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ============================================
-- Verification Queries (Run after creating indexes)
-- ============================================

-- Check all indexes on profiles table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'profiles';

-- Check all indexes on applications table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'applications';

-- Check all foreign key indexes
-- SELECT
--   t.relname AS table_name,
--   i.relname AS index_name,
--   a.attname AS column_name
-- FROM
--   pg_class t
--   JOIN pg_index ix ON t.oid = ix.indrelid
--   JOIN pg_class i ON i.oid = ix.indexrelid
--   JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
-- WHERE
--   t.relkind = 'r'
--   AND t.relname IN ('profiles', 'applications', 'blog_submissions', 'assignments', 'assignment_submissions', 'exam_access')
-- ORDER BY
--   t.relname, i.relname;

