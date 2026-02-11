# Pan-Africa Bitcoin Academy - Complete Database Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Student Management](#student-management)
4. [Academic Progress](#academic-progress)
5. [Rewards & Achievements](#rewards--achievements)
6. [Content Management](#content-management)
7. [Community & Engagement](#community--engagement)
8. [Administration](#administration)
9. [Database Relationships](#database-relationships)
10. [Indexes & Performance](#indexes--performance)
11. [Row Level Security (RLS)](#row-level-security-rls)

---

## Overview

The Pan-Africa Bitcoin Academy database is built on **PostgreSQL** (via Supabase) and uses **UUID** as primary keys throughout. The database is designed to support:

- Student enrollment and cohort management
- Academic progress tracking (chapters, assignments, exams)
- Sats rewards system
- Blog submission and publishing workflow
- Community features (mentors, testimonials, sponsorships)
- Administrative functions

---

## Core Tables

### 1. `cohorts`
**Purpose:** Defines training cohorts/batches of students

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `name` | TEXT | Cohort name (e.g., "Cohort 1") |
| `start_date` | DATE | Cohort start date |
| `end_date` | DATE | Cohort end date |
| `status` | TEXT | Status: 'Upcoming', 'Active', 'Completed' |
| `sessions` | INTEGER | Number of sessions (default: 0) |
| `level` | TEXT | Difficulty level: 'Beginner', 'Intermediate', 'Advanced' |
| `seats_total` | INTEGER | Total available seats (default: 0) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- Referenced by: `profiles`, `cohort_enrollment`, `events`, `assignments`, `blog_submissions`, `cohort_sessions`

**Indexes:**
- None explicitly defined (relies on primary key)

---

### 2. `profiles`
**Purpose:** Core user authentication and profile information

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key (used throughout system) |
| `student_id` | TEXT (UNIQUE) | Format: "cohort/roll/year" (e.g., "1/1/2025") |
| `name` | TEXT | Full name |
| `email` | TEXT (UNIQUE) | Email address (used for login) |
| `phone` | TEXT | Phone number |
| `country` | TEXT | Country |
| `city` | TEXT | City |
| `photo_url` | TEXT | Profile photo URL |
| `status` | TEXT | Student status: 'New', 'Active', 'Graduated', etc. (default: 'New') |
| `password_hash` | TEXT | Bcrypt hashed password |
| `reset_token` | TEXT | Password reset token |
| `reset_token_expiry` | TIMESTAMP | Reset token expiration |
| `cohort_id` | UUID (FK) | References `cohorts(id)` |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- **One-to-One:** `students` (via `profile_id`)
- **One-to-Many:** `sats_rewards`, `achievements`, `blog_submissions`, `blog_posts`, `assignment_submissions`, `chapter_progress`, `exam_access`, `exam_results`, `student_testimonials`
- **Many-to-Many:** `cohorts` (via `cohort_enrollment`)

**Indexes:**
- `idx_profiles_email` on `email`
- `idx_profiles_student_id` on `student_id`

**Notes:**
- This is the central user table - all student-related data references `profiles.id`
- Used for both students and admins (admins have separate `admins` table but may also have profiles)

---

### 3. `cohort_enrollment`
**Purpose:** Many-to-many relationship between students and cohorts

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `cohort_id` | UUID (FK) | References `cohorts(id)` ON DELETE CASCADE |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `enrolled_at` | TIMESTAMP | Enrollment timestamp |

**Constraints:**
- `UNIQUE(cohort_id, student_id)` - One enrollment per student per cohort

**Indexes:**
- `idx_cohort_enrollment_cohort` on `cohort_id`
- `idx_cohort_enrollment_student` on `student_id`

---

## Student Management

### 4. `students`
**Purpose:** Extends profiles with academic performance data

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `profile_id` | UUID (FK, UNIQUE) | References `profiles(id)` ON DELETE CASCADE |
| `progress_percent` | INTEGER | Overall progress percentage (0-100, default: 0) |
| `assignments_completed` | INTEGER | Number of completed assignments (default: 0) |
| `projects_completed` | INTEGER | Number of completed projects (default: 0) |
| `live_sessions_attended` | INTEGER | Number of live sessions attended (default: 0) |
| `exam_score` | INTEGER | Final exam score (added by exam system) |
| `exam_completed_at` | TIMESTAMP | Exam completion timestamp (added by exam system) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- **One-to-One:** `profiles` (via `profile_id`)

**Indexes:**
- `idx_students_profile` on `profile_id`
- `idx_students_exam_score` on `exam_score`

**Triggers:**
- `trigger_create_sats_rewards_on_student` - Automatically creates initial `sats_rewards` record when student is created

---

### 5. `applications`
**Purpose:** Student application submissions before enrollment

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `first_name` | TEXT | Applicant first name |
| `last_name` | TEXT | Applicant last name |
| `email` | TEXT | Applicant email |
| `phone` | TEXT | Applicant phone |
| `country` | TEXT | Applicant country |
| `city` | TEXT | Applicant city |
| `experience_level` | TEXT | Experience level |
| `preferred_cohort_id` | UUID (FK) | References `cohorts(id)` |
| `status` | TEXT | Application status: 'Pending', 'Approved', 'Rejected' (default: 'Pending') |
| `created_at` | TIMESTAMP | Application submission timestamp |

**Relationships:**
- **Many-to-One:** `cohorts` (via `preferred_cohort_id`)

**Indexes:**
- None explicitly defined

---

## Academic Progress

### 6. `chapter_progress`
**Purpose:** Tracks student progress through individual chapters

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `chapter_number` | INTEGER | Chapter number (1-21) |
| `chapter_slug` | TEXT | Chapter slug for URL routing |
| `is_unlocked` | BOOLEAN | Whether chapter is unlocked (default: false) |
| `is_completed` | BOOLEAN | Whether chapter is completed (default: false) |
| `unlocked_at` | TIMESTAMP | When chapter was unlocked |
| `completed_at` | TIMESTAMP | When chapter was completed |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `UNIQUE(student_id, chapter_number)` - One progress record per student per chapter

**Indexes:**
- `idx_chapter_progress_student` on `student_id`
- `idx_chapter_progress_chapter` on `chapter_number`
- `idx_chapter_progress_completed` on `is_completed`
- `idx_chapter_progress_unlocked` on `is_unlocked`
- `idx_chapter_progress_student_chapter` on `(student_id, chapter_number)`

---

### 7. `assignments`
**Purpose:** Assignment definitions and questions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `title` | TEXT | Assignment title |
| `description` | TEXT | Assignment description |
| `chapter_number` | INTEGER | Linked chapter number (optional) |
| `chapter_slug` | TEXT | Linked chapter slug (optional) |
| `question` | TEXT | Assignment question/prompt |
| `search_address` | TEXT | Address or txid to search (for Explorer Scavenger Hunt) |
| `correct_answer` | TEXT | Correct answer |
| `answer_type` | TEXT | Answer type: 'text', 'number', 'multiple_choice' (default: 'text') |
| `points` | INTEGER | Points awarded (default: 10) |
| `reward_sats` | INTEGER | Sats reward amount (default: 200) |
| `due_date` | TIMESTAMP | Optional due date |
| `status` | TEXT | Status: 'active', 'archived', 'draft' (default: 'active') |
| `cohort_id` | UUID (FK) | References `cohorts(id)` ON DELETE SET NULL (NULL = all cohorts) |
| `created_by` | UUID (FK) | References `profiles(id)` (admin who created) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- **One-to-Many:** `assignment_submissions`
- **Many-to-One:** `cohorts` (via `cohort_id`), `profiles` (via `created_by`)

**Indexes:**
- `idx_assignments_chapter` on `chapter_number`
- `idx_assignments_chapter_slug` on `chapter_slug`
- `idx_assignments_cohort` on `cohort_id`
- `idx_assignments_status` on `status`
- `idx_assignments_due_date` on `due_date`

---

### 8. `assignment_submissions`
**Purpose:** Student assignment submissions and grading

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `assignment_id` | UUID (FK) | References `assignments(id)` ON DELETE CASCADE |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `answer` | TEXT | Student's submitted answer |
| `is_correct` | BOOLEAN | Whether answer is correct (default: false) |
| `points_earned` | INTEGER | Points earned (default: 0) |
| `status` | TEXT | Status: 'submitted', 'graded', 'returned' (default: 'submitted') |
| `feedback` | TEXT | Optional feedback from admin |
| `graded_by` | UUID (FK) | References `profiles(id)` (admin who graded) |
| `submitted_at` | TIMESTAMP | Submission timestamp |
| `graded_at` | TIMESTAMP | Grading timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `UNIQUE(assignment_id, student_id)` - One submission per student per assignment

**Relationships:**
- **Many-to-One:** `assignments` (via `assignment_id`), `profiles` (via `student_id`, `graded_by`)

**Indexes:**
- `idx_assignment_submissions_student` on `student_id`
- `idx_assignment_submissions_assignment` on `assignment_id`
- `idx_assignment_submissions_status` on `status`
- `idx_assignment_submissions_submitted_at` on `submitted_at DESC`

---

### 9. `exam_access`
**Purpose:** Tracks which students have been granted exam access

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `granted_by` | UUID (FK) | References `profiles(id)` (admin who granted access) |
| `granted_at` | TIMESTAMP | When access was granted |
| `created_at` | TIMESTAMP | Creation timestamp |

**Constraints:**
- `UNIQUE(student_id)` - Each student can only have one access record

**Relationships:**
- **Many-to-One:** `profiles` (via `student_id`, `granted_by`)

**Indexes:**
- `idx_exam_access_student` on `student_id`

---

### 10. `exam_results`
**Purpose:** Stores exam submissions and scores

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `score` | INTEGER | Score out of 50 |
| `total_questions` | INTEGER | Total questions (default: 50) |
| `answers` | JSONB | All 50 answers: `{"1": "C", "2": "B", ...}` |
| `submitted_at` | TIMESTAMP | Submission timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |

**Constraints:**
- `UNIQUE(student_id)` - Each student can only take the exam once

**Relationships:**
- **Many-to-One:** `profiles` (via `student_id`)

**Indexes:**
- `idx_exam_results_student` on `student_id`
- `idx_exam_results_score` on `score DESC`

---

## Rewards & Achievements

### 11. `sats_rewards`
**Purpose:** Tracks all sats rewards (pending and paid) for students

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `amount_paid` | INTEGER | Amount already paid in sats (default: 0) |
| `amount_pending` | INTEGER | Amount pending in sats (default: 0) |
| `reason` | TEXT | Reason for reward |
| `status` | TEXT | Status: 'pending', 'processing', 'paid', 'failed' (default: 'pending') |
| `payment_date` | TIMESTAMP | When payment was made |
| `awarded_by` | UUID (FK) | References `profiles(id)` (admin who awarded) |
| `reward_type` | TEXT | Type: 'assignment', 'chapter', 'discussion', 'peer_help', 'project', 'attendance', 'blog', 'other' |
| `related_entity_type` | TEXT | Related entity: 'assignment', 'chapter', 'event', 'discussion', 'project', 'blog', 'other' |
| `related_entity_id` | UUID | ID of related entity (e.g., blog_posts.id, assignments.id) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `CHECK (status IN ('pending', 'processing', 'paid', 'failed'))`
- `CHECK (reward_type IN ('assignment', 'chapter', 'discussion', 'peer_help', 'project', 'attendance', 'blog', 'other'))`
- `CHECK (related_entity_type IN ('assignment', 'chapter', 'event', 'discussion', 'project', 'blog', 'other'))`

**Relationships:**
- **Many-to-One:** `profiles` (via `student_id`, `awarded_by`)

**Indexes:**
- `idx_sats_rewards_student_status` on `(student_id, status)`
- `idx_sats_rewards_student` on `student_id`
- `idx_sats_rewards_type` on `reward_type`
- `idx_sats_rewards_created` on `created_at DESC`
- `idx_sats_rewards_related_entity` on `(related_entity_type, related_entity_id)`
- `idx_sats_rewards_awarded_by` on `awarded_by`

**Notes:**
- Automatically created when a student record is created (via trigger)
- Used to track all types of rewards (assignments, chapters, blogs, etc.)
- `related_entity_id` links to specific entities (e.g., blog_posts.id for blog rewards)

---

### 12. `achievements`
**Purpose:** Tracks student achievements and badges

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `badge_name` | TEXT | Achievement badge name |
| `points` | INTEGER | Points awarded (default: 0) |
| `description` | TEXT | Achievement description |
| `earned_at` | TIMESTAMP | When achievement was earned (default: NOW()) |

**Relationships:**
- **Many-to-One:** `profiles` (via `student_id`)

**Indexes:**
- `idx_achievements_student` on `student_id`

---

## Content Management

### 13. `blog_submissions`
**Purpose:** Stores blog post submissions awaiting admin review

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `author_id` | UUID (FK) | References `profiles(id)` ON DELETE SET NULL |
| `author_name` | TEXT | Author name |
| `author_email` | TEXT | Author email |
| `cohort_id` | UUID (FK) | References `cohorts(id)` ON DELETE SET NULL |
| `cohort` | TEXT | Cohort name (for "Other" or custom cohorts) |
| `author_bio` | TEXT | Author biography |
| `title` | TEXT | Blog post title |
| `category` | TEXT | Blog category |
| `content` | TEXT | Full blog content |
| `status` | TEXT | Status: 'pending', 'approved', 'rejected' (default: 'pending') |
| `rejection_reason` | TEXT | Reason for rejection (if rejected) |
| `reviewed_at` | TIMESTAMP | When reviewed by admin |
| `reviewed_by` | UUID (FK) | References `profiles(id)` (admin who reviewed) |
| `created_at` | TIMESTAMP | Submission timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `CHECK (status IN ('pending', 'approved', 'rejected'))`

**Relationships:**
- **Many-to-One:** `profiles` (via `author_id`, `reviewed_by`), `cohorts` (via `cohort_id`)
- **Workflow:** When approved, creates a `blog_posts` record

**Indexes:**
- `idx_blog_submissions_author` on `author_id`
- `idx_blog_submissions_email` on `author_email`
- `idx_blog_submissions_status` on `status`
- `idx_blog_submissions_created` on `created_at DESC`
- `idx_blog_submissions_cohort_id` on `cohort_id`

---

### 14. `blog_posts`
**Purpose:** Published blog posts (created from approved submissions)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `slug` | TEXT (UNIQUE) | URL-friendly slug |
| `title` | TEXT | Blog post title |
| `author_id` | UUID (FK) | References `profiles(id)` ON DELETE SET NULL |
| `author_name` | TEXT | Author name |
| `author_role` | TEXT | Author role (e.g., "Graduate, Cohort 1") |
| `author_country` | TEXT | Author country |
| `author_bio` | TEXT | Author biography |
| `category` | TEXT | Blog category |
| `excerpt` | TEXT | Short excerpt for preview |
| `content` | TEXT | Full blog content |
| `status` | TEXT | Status: 'draft', 'published', 'archived' (default: 'draft') |
| `is_featured` | BOOLEAN | Featured post flag (default: false) |
| `is_blog_of_month` | BOOLEAN | Blog of the month flag (default: false) |
| `published_at` | TIMESTAMP | Publication timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `CHECK (status IN ('draft', 'published', 'archived'))`

**Relationships:**
- **Many-to-One:** `profiles` (via `author_id`)
- **One-to-Many:** `sats_rewards` (via `related_entity_id` when `related_entity_type = 'blog'`)

**Indexes:**
- `idx_blog_posts_slug` on `slug`
- `idx_blog_posts_author` on `author_id`
- `idx_blog_posts_status` on `status`
- `idx_blog_posts_published` on `published_at DESC`
- `idx_blog_posts_featured` on `is_featured`
- `idx_blog_posts_category` on `category`

**Notes:**
- Created automatically when a blog submission is approved
- Linked to sats rewards via `sats_rewards.related_entity_id = blog_posts.id`

---

## Community & Engagement

### 15. `events`
**Purpose:** Calendar events (live classes, workshops, deadlines, etc.)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `name` | TEXT | Event name |
| `type` | TEXT | Event type: 'live-class', 'assignment', 'community', 'workshop', 'deadline', 'quiz', 'cohort' |
| `start_time` | TIMESTAMP | Event start time |
| `end_time` | TIMESTAMP | Event end time |
| `description` | TEXT | Event description |
| `link` | TEXT | Event link (Zoom, etc.) |
| `recording_url` | TEXT | Recording URL (after event) |
| `cohort_id` | UUID (FK) | References `cohorts(id)` ON DELETE SET NULL (NULL = all cohorts) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- **Many-to-One:** `cohorts` (via `cohort_id`)

**Indexes:**
- `idx_events_start_time` on `start_time`
- `idx_events_cohort_id` on `cohort_id`

---

### 16. `cohort_sessions`
**Purpose:** Automatically generated sessions for each cohort

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `cohort_id` | UUID (FK) | References `cohorts(id)` ON DELETE CASCADE |
| `session_date` | DATE | Session date |
| `session_number` | INTEGER | Session number (1, 2, 3, ...) |
| `topic` | TEXT | Session topic |
| `instructor` | TEXT | Instructor name |
| `duration_minutes` | INTEGER | Session duration (default: 90) |
| `link` | TEXT | Session link |
| `recording_url` | TEXT | Recording URL |
| `status` | TEXT | Status: 'scheduled', 'completed', 'cancelled', 'rescheduled' (default: 'scheduled') |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `UNIQUE(cohort_id, session_date)`
- `UNIQUE(cohort_id, session_number)`

**Relationships:**
- **Many-to-One:** `cohorts` (via `cohort_id`)

**Indexes:**
- `idx_cohort_sessions_cohort_id` on `cohort_id`
- `idx_cohort_sessions_session_date` on `session_date`
- `idx_cohort_sessions_cohort_date` on `(cohort_id, session_date)`

---

### 17. `mentors`
**Purpose:** Approved mentors and volunteers

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `mentorship_application_id` | UUID (FK, UNIQUE) | References `mentorship_applications(id)` ON DELETE CASCADE |
| `name` | TEXT | Mentor name |
| `role` | TEXT | Mentor role |
| `description` | TEXT | Short description/bio |
| `type` | TEXT | Type: 'Mentor', 'Volunteer', 'Guest Lecturer' |
| `image_url` | TEXT | Profile image URL |
| `github` | TEXT | GitHub profile URL |
| `twitter` | TEXT | Twitter/X profile URL |
| `bio` | TEXT | Full biography |
| `is_active` | BOOLEAN | Active status (default: true) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `CHECK (type IN ('Mentor', 'Volunteer', 'Guest Lecturer'))`

**Relationships:**
- **Many-to-One:** `mentorship_applications` (via `mentorship_application_id`)

**Indexes:**
- `idx_mentors_application_id` on `mentorship_application_id`
- `idx_mentors_type` on `type`
- `idx_mentors_active` on `is_active`
- `idx_mentors_created_at` on `created_at DESC`

**Notes:**
- Linked to `mentorship_applications` table (schema not found in migration files, but referenced)

---

### 18. `sponsorships`
**Purpose:** Tracks student sponsorships and donations

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `sponsor_name` | TEXT | Sponsor name |
| `sponsor_email` | TEXT | Sponsor email |
| `sponsor_anonymous` | BOOLEAN | Hide sponsor name publicly (default: false) |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE SET NULL (optional) |
| `amount_sats` | INTEGER | Amount in sats |
| `payment_method` | TEXT | Payment method: 'lightning', 'onchain', 'other' |
| `payment_tx_id` | TEXT | Transaction ID or payment reference |
| `status` | TEXT | Status: 'pending', 'confirmed', 'completed', 'cancelled' (default: 'pending') |
| `message` | TEXT | Optional message from sponsor |
| `is_general_sponsorship` | BOOLEAN | General academy support (not specific student) (default: false) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `CHECK (payment_method IN ('lightning', 'onchain', 'other'))`
- `CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))`

**Relationships:**
- **Many-to-One:** `profiles` (via `student_id`)

**Indexes:**
- `idx_sponsorships_student` on `student_id`
- `idx_sponsorships_status` on `status`
- `idx_sponsorships_created` on `created_at DESC`
- `idx_sponsorships_sponsor_email` on `sponsor_email`

---

### 19. `student_testimonials`
**Purpose:** Student testimonials for display on impact page

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `student_id` | UUID (FK) | References `profiles(id)` ON DELETE CASCADE |
| `testimonial` | TEXT | Testimonial text/quote |
| `is_approved` | BOOLEAN | Approval status (default: false) |
| `is_featured` | BOOLEAN | Featured status (default: false) |
| `display_order` | INTEGER | Display order (default: 0) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- **Many-to-One:** `profiles` (via `student_id`)

**Indexes:**
- `idx_testimonials_student_id` on `student_id`
- `idx_testimonials_approved` on `is_approved`
- `idx_testimonials_featured` on `is_featured`
- `idx_testimonials_display_order` on `display_order`

---

### 20. `developer_resources`
**Purpose:** Developer resources and learning materials

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `title` | TEXT | Resource title |
| `url` | TEXT | Resource URL |
| `category` | TEXT | Resource category |
| `level` | TEXT | Difficulty level: 'Beginner', 'Intermediate', 'Advanced' |
| `description` | TEXT | Resource description |
| `created_at` | TIMESTAMP | Creation timestamp |

**Indexes:**
- None explicitly defined

---

### 21. `developer_events`
**Purpose:** Developer events and meetups

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `name` | TEXT | Event name |
| `type` | TEXT | Event type |
| `start_time` | TIMESTAMP | Event start time |
| `end_time` | TIMESTAMP | Event end time |
| `location` | TEXT | Event location |
| `link` | TEXT | Event link |
| `description` | TEXT | Event description |
| `created_at` | TIMESTAMP | Creation timestamp |

**Indexes:**
- None explicitly defined

---

## Administration

### 22. `admins`
**Purpose:** Admin user accounts (referenced in code, schema not in migration files)

**Note:** This table is referenced in the application code but the schema definition is not found in the migration files. Based on code usage, it likely contains:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `email` | TEXT (UNIQUE) | Admin email |
| `password_hash` | TEXT | Bcrypt hashed password |
| `role` | TEXT | Admin role |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Relationships:**
- May reference `profiles` table for additional admin information

---

## Database Relationships

### Entity Relationship Diagram (Text)

```
cohorts (1) ──< (M) cohort_enrollment (M) >── (1) profiles
                                                      │
                                                      │ (1:1)
                                                      │
                                                      ▼
                                                  students
                                                      │
                                                      │ (1:M)
                                                      │
        ┌─────────────────────────────────────────────┼─────────────────────────────┐
        │                                             │                             │
        ▼                                             ▼                             ▼
sats_rewards                                    achievements              chapter_progress
        │
        │ (M:1 via related_entity_id)
        │
        ├──> blog_posts (when related_entity_type = 'blog')
        ├──> assignments (when related_entity_type = 'assignment')
        └──> ...

profiles (1) ──< (M) blog_submissions
    │
    │ (1:M)
    │
    ├──> blog_posts
    ├──> assignment_submissions
    ├──> exam_access
    ├──> exam_results
    └──> student_testimonials

cohorts (1) ──< (M) events
cohorts (1) ──< (M) assignments
cohorts (1) ──< (M) cohort_sessions
cohorts (1) ──< (M) blog_submissions

assignments (1) ──< (M) assignment_submissions
```

---

## Indexes & Performance

### Key Indexes by Table

1. **profiles**: `email`, `student_id`
2. **sats_rewards**: `(student_id, status)`, `reward_type`, `(related_entity_type, related_entity_id)`
3. **blog_posts**: `slug`, `author_id`, `status`, `published_at`, `is_featured`, `category`
4. **blog_submissions**: `author_id`, `email`, `status`, `created_at`, `cohort_id`
5. **assignments**: `chapter_number`, `chapter_slug`, `cohort_id`, `status`, `due_date`
6. **assignment_submissions**: `student_id`, `assignment_id`, `status`, `submitted_at`
7. **chapter_progress**: `student_id`, `chapter_number`, `(student_id, chapter_number)`
8. **exam_results**: `student_id`, `score`
9. **cohort_sessions**: `cohort_id`, `session_date`, `(cohort_id, session_date)`

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies vary by table:

### Public Read Access
- `profiles`, `cohorts`, `cohort_enrollment`, `students`, `events`, `sats_rewards`, `achievements`, `developer_resources`, `developer_events`, `applications`
- `blog_posts` (only `status = 'published'`)
- `cohort_sessions`
- `mentors` (only `is_active = true`)
- `sponsorships` (only `status = 'confirmed' AND sponsor_anonymous = false`)
- `student_testimonials` (only `is_approved = true`)

### Public Insert Access
- `applications`
- `profiles`
- `blog_submissions`

### Admin-Only Access
- `exam_access`, `exam_results` (API only, no direct client access)
- `mentors`, `sponsorships`, `student_testimonials` (INSERT/UPDATE/DELETE blocked from client)
- `assignments`, `assignment_submissions` (admin policies for management)

### Student-Specific Access
- `assignment_submissions` (students can view/insert their own)
- `chapter_progress` (students can view their own)

**Note:** Most admin operations use `supabaseAdmin` (service role) which bypasses RLS.

---

## Triggers

### Automatic Timestamp Updates
- `update_updated_at_column()` function updates `updated_at` on:
  - `profiles`
  - `cohorts`
  - `students`
  - `events`
  - `sats_rewards`
  - `assignments`
  - `assignment_submissions`
  - `blog_submissions`
  - `blog_posts`
  - `cohort_sessions`
  - `chapter_progress`

### Automatic Sats Rewards Creation
- `create_sats_rewards_for_student()` function creates initial `sats_rewards` record when a student is created
- Trigger: `trigger_create_sats_rewards_on_student` on `students` table

---

## Data Workflows

### Blog Approval Workflow
1. Student submits blog → `blog_submissions` (status: 'pending')
2. Admin approves → `blog_submissions` (status: 'approved')
3. System creates → `blog_posts` (status: 'published')
4. System creates → `sats_rewards` (amount_pending: 2000, reward_type: 'blog', related_entity_id: blog_posts.id)

### Assignment Submission Workflow
1. Student submits answer → `assignment_submissions` (status: 'submitted')
2. System validates answer → `assignment_submissions` (is_correct: true/false, status: 'graded')
3. If correct → `sats_rewards` (amount_pending: assignment.reward_sats, reward_type: 'assignment', related_entity_id: assignment.id)

### Chapter Completion Workflow
1. Student completes chapter → `chapter_progress` (is_completed: true)
2. System creates → `sats_rewards` (amount_pending: 100, reward_type: 'chapter', related_entity_id: chapter_number)

---

## Notes & Best Practices

1. **UUID Primary Keys**: All tables use UUID for primary keys, generated via `uuid_generate_v4()`
2. **Cascade Deletes**: Most foreign keys use `ON DELETE CASCADE` to maintain referential integrity
3. **Timestamps**: All tables include `created_at` and `updated_at` timestamps
4. **Status Fields**: Many tables use status fields with CHECK constraints
5. **Service Role**: Admin operations typically use `supabaseAdmin` (service role) which bypasses RLS
6. **Email Normalization**: Email addresses should be normalized (lowercase, trimmed) before storage
7. **Password Hashing**: Passwords are hashed using bcrypt before storage

---

## Missing Tables (Referenced but Schema Not Found)

1. **`mentorship_applications`**: Referenced by `mentors.mentorship_application_id`
2. **`admins`**: Referenced in code but schema not in migration files

---

**Last Updated:** 2024
**Database:** PostgreSQL (Supabase)
**Version:** Based on migration files in `supabase/` directory

