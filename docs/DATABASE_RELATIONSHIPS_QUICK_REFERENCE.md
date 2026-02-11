# Database Relationships Quick Reference

## ✅ All Relationships Status

| Table | Foreign Key Column | References | Cascade | Index | Status |
|-------|-------------------|------------|---------|-------|--------|
| `profiles` | `cohort_id` | `cohorts.id` | RESTRICT | ❌ | ⚠️ **MISSING INDEX** |
| `cohort_enrollment` | `cohort_id` | `cohorts.id` | CASCADE | ✅ | ✅ OK |
| `cohort_enrollment` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `students` | `profile_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `events` | `cohort_id` | `cohorts.id` | SET NULL | ✅ | ✅ OK |
| `sats_rewards` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `sats_rewards` | `awarded_by` | `profiles.id` | RESTRICT | ✅ | ✅ OK |
| `achievements` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `applications` | `preferred_cohort_id` | `cohorts.id` | RESTRICT | ❌ | ⚠️ **MISSING INDEX** |
| `blog_submissions` | `author_id` | `profiles.id` | SET NULL | ✅ | ✅ OK |
| `blog_submissions` | `cohort_id` | `cohorts.id` | SET NULL | ✅ | ✅ OK |
| `blog_submissions` | `reviewed_by` | `profiles.id` | RESTRICT | ❌ | ⚠️ **MISSING INDEX** |
| `blog_posts` | `author_id` | `profiles.id` | SET NULL | ✅ | ✅ OK |
| `chapter_progress` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `assignments` | `cohort_id` | `cohorts.id` | SET NULL | ✅ | ✅ OK |
| `assignments` | `created_by` | `profiles.id` | RESTRICT | ❌ | ⚠️ **MISSING INDEX** |
| `assignment_submissions` | `assignment_id` | `assignments.id` | CASCADE | ✅ | ✅ OK |
| `assignment_submissions` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `assignment_submissions` | `graded_by` | `profiles.id` | RESTRICT | ❌ | ⚠️ **MISSING INDEX** |
| `exam_access` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `exam_access` | `granted_by` | `profiles.id` | RESTRICT | ❌ | ⚠️ **MISSING INDEX** |
| `exam_results` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `cohort_sessions` | `cohort_id` | `cohorts.id` | CASCADE | ✅ | ✅ OK |
| `student_testimonials` | `student_id` | `profiles.id` | CASCADE | ✅ | ✅ OK |
| `sponsorships` | `student_id` | `profiles.id` | SET NULL | ✅ | ✅ OK |
| `mentors` | `mentorship_application_id` | `mentorship_applications.id` | CASCADE | ✅ | ✅ OK |

## Summary

- **Total Relationships:** 25
- **Properly Indexed:** 19 (76%)
- **Missing Indexes:** 6 (24%)
- **Overall Status:** ✅ **GOOD** (needs minor improvements)

## Quick Fix

Run `supabase/fix-missing-indexes.sql` to add all missing indexes.

