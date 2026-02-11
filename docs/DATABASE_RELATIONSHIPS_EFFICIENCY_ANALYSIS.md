# Database Relationships & Efficiency Analysis

## Executive Summary

This document analyzes all foreign key relationships, indexes, and potential performance issues in the Pan-Africa Bitcoin Academy database.

**Overall Status:** ✅ **GOOD** - Most relationships are properly indexed, but there are some improvements needed.

---

## Foreign Key Relationships Analysis

### 1. `profiles.cohort_id` → `cohorts.id`
- **Type:** Many-to-One
- **Cascade:** None (default RESTRICT)
- **Index:** ❌ **MISSING** - No index on `profiles.cohort_id`
- **Issue:** Queries filtering profiles by cohort will be slow
- **Recommendation:** Add index: `CREATE INDEX idx_profiles_cohort_id ON profiles(cohort_id);`

### 2. `cohort_enrollment.cohort_id` → `cohorts.id`
- **Type:** Many-to-Many (junction table)
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_cohort_enrollment_cohort`
- **Status:** ✅ **GOOD**

### 3. `cohort_enrollment.student_id` → `profiles.id`
- **Type:** Many-to-Many (junction table)
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_cohort_enrollment_student`
- **Status:** ✅ **GOOD**

### 4. `students.profile_id` → `profiles.id`
- **Type:** One-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_students_profile`
- **Unique Constraint:** ✅ `UNIQUE`
- **Status:** ✅ **GOOD**

### 5. `events.cohort_id` → `cohorts.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** `ON DELETE SET NULL` ✅ (appropriate for nullable FK)
- **Index:** ✅ `idx_events_cohort_id`
- **Status:** ✅ **GOOD**

### 6. `sats_rewards.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_sats_rewards_student` and `idx_sats_rewards_student_status`
- **Status:** ✅ **GOOD**

### 7. `sats_rewards.awarded_by` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** None (default RESTRICT)
- **Index:** ✅ `idx_sats_rewards_awarded_by`
- **Status:** ✅ **GOOD**

### 8. `sats_rewards.related_entity_id` → Various (polymorphic)
- **Type:** Polymorphic relationship (no FK constraint)
- **Cascade:** N/A (no FK)
- **Index:** ✅ `idx_sats_rewards_related_entity` (composite on `related_entity_type, related_entity_id`)
- **Status:** ✅ **GOOD** (polymorphic relationships don't use FK constraints)

### 9. `achievements.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_achievements_student`
- **Status:** ✅ **GOOD**

### 10. `applications.preferred_cohort_id` → `cohorts.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** None (default RESTRICT)
- **Index:** ❌ **MISSING** - No index on `applications.preferred_cohort_id`
- **Issue:** Queries filtering applications by cohort will be slow
- **Recommendation:** Add index: `CREATE INDEX idx_applications_cohort_id ON applications(preferred_cohort_id);`

### 11. `blog_submissions.author_id` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** `ON DELETE SET NULL` ✅
- **Index:** ✅ `idx_blog_submissions_author`
- **Status:** ✅ **GOOD**

### 12. `blog_submissions.cohort_id` → `cohorts.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** `ON DELETE SET NULL` ✅
- **Index:** ✅ `idx_blog_submissions_cohort_id`
- **Status:** ✅ **GOOD**

### 13. `blog_submissions.reviewed_by` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** None (default RESTRICT)
- **Index:** ❌ **MISSING** - No index on `blog_submissions.reviewed_by`
- **Issue:** Queries filtering by reviewer will be slow
- **Recommendation:** Add index: `CREATE INDEX idx_blog_submissions_reviewed_by ON blog_submissions(reviewed_by);`

### 14. `blog_posts.author_id` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** `ON DELETE SET NULL` ✅
- **Index:** ✅ `idx_blog_posts_author`
- **Status:** ✅ **GOOD**

### 15. `chapter_progress.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_chapter_progress_student` and composite `idx_chapter_progress_student_chapter`
- **Status:** ✅ **GOOD**

### 16. `assignments.cohort_id` → `cohorts.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** `ON DELETE SET NULL` ✅
- **Index:** ✅ `idx_assignments_cohort`
- **Status:** ✅ **GOOD**

### 17. `assignments.created_by` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** None (default RESTRICT)
- **Index:** ❌ **MISSING** - No index on `assignments.created_by`
- **Issue:** Queries filtering by creator will be slow
- **Recommendation:** Add index: `CREATE INDEX idx_assignments_created_by ON assignments(created_by);`

### 18. `assignment_submissions.assignment_id` → `assignments.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_assignment_submissions_assignment`
- **Status:** ✅ **GOOD**

### 19. `assignment_submissions.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_assignment_submissions_student`
- **Status:** ✅ **GOOD**

### 20. `assignment_submissions.graded_by` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** None (default RESTRICT)
- **Index:** ❌ **MISSING** - No index on `assignment_submissions.graded_by`
- **Issue:** Queries filtering by grader will be slow
- **Recommendation:** Add index: `CREATE INDEX idx_assignment_submissions_graded_by ON assignment_submissions(graded_by);`

### 21. `exam_access.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_exam_access_student`
- **Status:** ✅ **GOOD**

### 22. `exam_access.granted_by` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** None (default RESTRICT)
- **Index:** ❌ **MISSING** - No index on `exam_access.granted_by`
- **Issue:** Queries filtering by grantor will be slow
- **Recommendation:** Add index: `CREATE INDEX idx_exam_access_granted_by ON exam_access(granted_by);`

### 23. `exam_results.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_exam_results_student`
- **Status:** ✅ **GOOD**

### 24. `cohort_sessions.cohort_id` → `cohorts.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_cohort_sessions_cohort_id` and composite `idx_cohort_sessions_cohort_date`
- **Status:** ✅ **GOOD**

### 25. `student_testimonials.student_id` → `profiles.id`
- **Type:** Many-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_testimonials_student_id`
- **Status:** ✅ **GOOD**

### 26. `sponsorships.student_id` → `profiles.id`
- **Type:** Many-to-One (nullable)
- **Cascade:** `ON DELETE SET NULL` ✅
- **Index:** ✅ `idx_sponsorships_student`
- **Status:** ✅ **GOOD**

### 27. `mentors.mentorship_application_id` → `mentorship_applications.id`
- **Type:** One-to-One
- **Cascade:** `ON DELETE CASCADE` ✅
- **Index:** ✅ `idx_mentors_application_id`
- **Unique Constraint:** ✅ `UNIQUE`
- **Status:** ✅ **GOOD** (Note: `mentorship_applications` table schema not found)

---

## Missing Indexes Summary

### Critical Missing Indexes (High Priority)

1. **`profiles.cohort_id`** ❌
   - **Impact:** High - Frequently queried
   - **Query Pattern:** `SELECT * FROM profiles WHERE cohort_id = ?`
   - **Fix:** `CREATE INDEX idx_profiles_cohort_id ON profiles(cohort_id);`

2. **`applications.preferred_cohort_id`** ❌
   - **Impact:** High - Frequently queried in admin dashboard
   - **Query Pattern:** `SELECT * FROM applications WHERE preferred_cohort_id = ?`
   - **Fix:** `CREATE INDEX idx_applications_cohort_id ON applications(preferred_cohort_id);`

### Medium Priority Missing Indexes

3. **`blog_submissions.reviewed_by`** ❌
   - **Impact:** Medium - Used in admin queries
   - **Query Pattern:** `SELECT * FROM blog_submissions WHERE reviewed_by = ?`
   - **Fix:** `CREATE INDEX idx_blog_submissions_reviewed_by ON blog_submissions(reviewed_by);`

4. **`assignments.created_by`** ❌
   - **Impact:** Medium - Used in admin queries
   - **Query Pattern:** `SELECT * FROM assignments WHERE created_by = ?`
   - **Fix:** `CREATE INDEX idx_assignments_created_by ON assignments(created_by);`

5. **`assignment_submissions.graded_by`** ❌
   - **Impact:** Medium - Used in admin queries
   - **Query Pattern:** `SELECT * FROM assignment_submissions WHERE graded_by = ?`
   - **Fix:** `CREATE INDEX idx_assignment_submissions_graded_by ON assignment_submissions(graded_by);`

6. **`exam_access.granted_by`** ❌
   - **Impact:** Low - Less frequently queried
   - **Query Pattern:** `SELECT * FROM exam_access WHERE granted_by = ?`
   - **Fix:** `CREATE INDEX idx_exam_access_granted_by ON exam_access(granted_by);`

---

## Cascade Behavior Analysis

### ✅ Appropriate Cascade Behaviors

1. **`ON DELETE CASCADE`** - Used correctly for:
   - `cohort_enrollment` → `cohorts`, `profiles` (enrollment should be deleted)
   - `students` → `profiles` (student record should be deleted)
   - `sats_rewards` → `profiles` (rewards should be deleted)
   - `achievements` → `profiles` (achievements should be deleted)
   - `chapter_progress` → `profiles` (progress should be deleted)
   - `assignment_submissions` → `assignments`, `profiles` (submissions should be deleted)
   - `exam_access`, `exam_results` → `profiles` (exam data should be deleted)
   - `student_testimonials` → `profiles` (testimonials should be deleted)
   - `cohort_sessions` → `cohorts` (sessions should be deleted)

2. **`ON DELETE SET NULL`** - Used correctly for:
   - `events.cohort_id` → `cohorts` (event can exist without cohort)
   - `blog_submissions.author_id` → `profiles` (submission can exist without author)
   - `blog_submissions.cohort_id` → `cohorts` (submission can exist without cohort)
   - `blog_posts.author_id` → `profiles` (post can exist without author)
   - `assignments.cohort_id` → `cohorts` (assignment can be for all cohorts)
   - `sponsorships.student_id` → `profiles` (sponsorship can be general)

### ⚠️ Potential Issues

1. **`profiles.cohort_id`** - No cascade defined (default RESTRICT)
   - **Issue:** Cannot delete a cohort if profiles reference it
   - **Current Behavior:** Must manually update or delete profiles first
   - **Recommendation:** Consider `ON DELETE SET NULL` if profiles can exist without cohorts

2. **`sats_rewards.awarded_by`** - No cascade (default RESTRICT)
   - **Status:** ✅ OK - Awards should remain even if admin is deleted

3. **`blog_submissions.reviewed_by`** - No cascade (default RESTRICT)
   - **Status:** ✅ OK - Review history should remain even if admin is deleted

4. **`assignments.created_by`** - No cascade (default RESTRICT)
   - **Status:** ✅ OK - Assignments should remain even if creator is deleted

---

## Composite Indexes Analysis

### ✅ Well-Designed Composite Indexes

1. **`idx_sats_rewards_student_status`** on `(student_id, status)`
   - **Usage:** Queries like `WHERE student_id = ? AND status = ?`
   - **Status:** ✅ **GOOD**

2. **`idx_sats_rewards_related_entity`** on `(related_entity_type, related_entity_id)`
   - **Usage:** Polymorphic relationship queries
   - **Status:** ✅ **GOOD**

3. **`idx_cohort_sessions_cohort_date`** on `(cohort_id, session_date)`
   - **Usage:** Queries filtering by cohort and date
   - **Status:** ✅ **GOOD**

4. **`idx_chapter_progress_student_chapter`** on `(student_id, chapter_number)`
   - **Usage:** Unique constraint and lookups
   - **Status:** ✅ **GOOD**

### ⚠️ Potential Missing Composite Indexes

1. **`blog_submissions`** - Consider composite index on `(status, created_at)` for admin dashboard
   - **Query Pattern:** `SELECT * FROM blog_submissions WHERE status = ? ORDER BY created_at DESC`
   - **Current:** Separate indexes on `status` and `created_at`
   - **Recommendation:** `CREATE INDEX idx_blog_submissions_status_created ON blog_submissions(status, created_at DESC);`

2. **`assignment_submissions`** - Consider composite index on `(assignment_id, status)` for filtering
   - **Query Pattern:** `SELECT * FROM assignment_submissions WHERE assignment_id = ? AND status = ?`
   - **Current:** Separate indexes
   - **Recommendation:** `CREATE INDEX idx_assignment_submissions_assignment_status ON assignment_submissions(assignment_id, status);`

---

## Query Performance Analysis

### Frequently Queried Patterns (from API code analysis)

1. **Profiles by Cohort** ⚠️
   - **Query:** `SELECT * FROM profiles WHERE cohort_id = ?`
   - **Status:** ❌ **MISSING INDEX**
   - **Impact:** High - Used in many admin queries

2. **Applications by Cohort** ⚠️
   - **Query:** `SELECT * FROM applications WHERE preferred_cohort_id = ?`
   - **Status:** ❌ **MISSING INDEX**
   - **Impact:** High - Used in admin dashboard

3. **Events by Cohort** ✅
   - **Query:** `SELECT * FROM events WHERE cohort_id = ? OR cohort_id IS NULL`
   - **Status:** ✅ **HAS INDEX** (`idx_events_cohort_id`)

4. **Sats Rewards by Student and Status** ✅
   - **Query:** `SELECT * FROM sats_rewards WHERE student_id = ? AND status = ?`
   - **Status:** ✅ **HAS COMPOSITE INDEX** (`idx_sats_rewards_student_status`)

5. **Blog Posts by Author** ✅
   - **Query:** `SELECT * FROM blog_posts WHERE author_id = ?`
   - **Status:** ✅ **HAS INDEX** (`idx_blog_posts_author`)

6. **Assignment Submissions by Student** ✅
   - **Query:** `SELECT * FROM assignment_submissions WHERE student_id = ?`
   - **Status:** ✅ **HAS INDEX** (`idx_assignment_submissions_student`)

---

## Recommendations

### Immediate Actions (High Priority)

1. **Add missing index on `profiles.cohort_id`**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_profiles_cohort_id ON profiles(cohort_id);
   ```

2. **Add missing index on `applications.preferred_cohort_id`**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_applications_cohort_id ON applications(preferred_cohort_id);
   ```

### Medium Priority Actions

3. **Add missing indexes on nullable FK columns used in queries**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_blog_submissions_reviewed_by ON blog_submissions(reviewed_by);
   CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
   CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded_by ON assignment_submissions(graded_by);
   CREATE INDEX IF NOT EXISTS idx_exam_access_granted_by ON exam_access(granted_by);
   ```

4. **Add composite index for blog submissions status queries**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_blog_submissions_status_created ON blog_submissions(status, created_at DESC);
   ```

5. **Add composite index for assignment submissions filtering**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_status ON assignment_submissions(assignment_id, status);
   ```

### Optional Improvements

6. **Consider adding index on `profiles.status`** (if frequently filtered)
   ```sql
   CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
   ```

7. **Consider adding index on `applications.status`** (if frequently filtered)
   ```sql
   CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
   ```

---

## Complete Migration Script

```sql
-- ============================================
-- Database Relationships & Efficiency Fixes
-- ============================================

-- High Priority: Missing Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_cohort_id ON profiles(cohort_id);
CREATE INDEX IF NOT EXISTS idx_applications_cohort_id ON applications(preferred_cohort_id);

-- Medium Priority: Missing Foreign Key Indexes (Nullable)
CREATE INDEX IF NOT EXISTS idx_blog_submissions_reviewed_by ON blog_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_graded_by ON assignment_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_exam_access_granted_by ON exam_access(granted_by);

-- Composite Indexes for Better Query Performance
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status_created ON blog_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_status ON assignment_submissions(assignment_id, status);

-- Optional: Status Indexes (if frequently filtered)
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
```

---

## Summary

### ✅ Strengths
- Most foreign keys are properly indexed
- Cascade behaviors are appropriate
- Composite indexes are well-designed for common query patterns
- Unique constraints are properly defined

### ⚠️ Issues Found
- **6 missing indexes** on foreign key columns
- **2 missing composite indexes** for common query patterns
- **1 potential cascade issue** (`profiles.cohort_id`)

### 📊 Impact Assessment
- **High Impact:** 2 missing indexes (profiles.cohort_id, applications.preferred_cohort_id)
- **Medium Impact:** 4 missing indexes (reviewed_by, created_by, graded_by, granted_by)
- **Low Impact:** 2 missing composite indexes

### ✅ Overall Grade: **B+**
The database is well-structured with good indexing overall, but adding the recommended indexes will improve query performance, especially for admin dashboard operations.

---

**Last Updated:** 2024
**Analysis Date:** Based on current schema files

