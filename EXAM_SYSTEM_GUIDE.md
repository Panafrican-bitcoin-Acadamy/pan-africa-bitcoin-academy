# Final Exam System - Complete Guide

## Overview

The Pan-Africa Bitcoin Academy Final Exam is a comprehensive 50-question multiple-choice assessment that students must complete after finishing Chapter 21. The system includes access control, validation, scoring, and result storage.

## Features

✅ **50 Multiple Choice Questions** - Each question has 4 answer options (A, B, C, D)  
✅ **Access Control** - Locked until Chapter 21 is completed AND admin grants access  
✅ **Validation** - Ensures exactly one answer per question (not 0, not 2+)  
✅ **Auto-scroll to Missing Questions** - Directs user to unanswered questions  
✅ **Score Calculation** - Automatically calculates score out of 50  
✅ **Database Storage** - Stores results in `exam_results` and `students` tables  
✅ **Admin Management** - Admin can grant/revoke exam access  
✅ **Student Dashboard Integration** - Shows exam status and results  

---

## Database Schema

### Tables Created

#### 1. `exam_access`
Tracks which students have been granted exam access by admin.

```sql
- id (UUID)
- student_id (UUID) → references profiles(id)
- granted_by (UUID) → references profiles(id) - admin who granted access
- granted_at (TIMESTAMP)
- created_at (TIMESTAMP)
- UNIQUE(student_id)
```

#### 2. `exam_results`
Stores exam submissions and scores.

```sql
- id (UUID)
- student_id (UUID) → references profiles(id)
- score (INTEGER) - Score out of 50
- total_questions (INTEGER) - Default 50
- answers (JSONB) - All 50 answers: {"1": "C", "2": "B", ...}
- submitted_at (TIMESTAMP)
- created_at (TIMESTAMP)
- UNIQUE(student_id) - Each student can only take exam once
```

#### 3. `students` table updates
Added columns:
- `exam_score` (INTEGER) - Quick access to exam score
- `exam_completed_at` (TIMESTAMP) - When exam was completed

### Migration

Run the SQL migration file in Supabase SQL Editor:

```bash
supabase/add-exam-tables.sql
```

---

## Access Control Flow

### Requirements for Exam Access:

1. ✅ **Student must be registered** (has profile)
2. ✅ **Student must be enrolled** (has student record)
3. ✅ **Chapter 21 must be completed** (`chapter_progress.is_completed = true`)
4. ✅ **Admin must grant access** (record in `exam_access` table)
5. ✅ **Exam not already completed** (no record in `exam_results`)

### Access Check API

**Endpoint:** `POST /api/exam/check-access`

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "hasAccess": true,
  "isRegistered": true,
  "isEnrolled": true,
  "chapter21Completed": true,
  "hasAdminAccess": true,
  "examCompleted": false,
  "examScore": null,
  "message": "You have access to take the exam"
}
```

---

## Exam Page

**Route:** `/exam`

### Features:

1. **Access Check** - Automatically checks if student has access
2. **50 Questions Display** - Shows all questions with 4 options each
3. **Answer Selection** - Radio buttons for single answer selection
4. **Progress Tracking** - Shows "Answered: X / 50"
5. **Validation** - Before submit, validates all questions answered
6. **Error Highlighting** - Highlights unanswered questions in red
7. **Auto-scroll** - Scrolls to first unanswered question
8. **Submit Confirmation** - Confirms before final submission
9. **Results Display** - Shows score after submission

### Validation Rules:

- ✅ Exactly one answer must be selected per question
- ✅ Answer must be A, B, C, or D
- ✅ All 50 questions must be answered before submission
- ✅ If validation fails, user is directed to missing questions

---

## API Endpoints

### 1. Check Exam Access
**POST** `/api/exam/check-access`

Checks if student has access to take the exam.

### 2. Submit Exam
**POST** `/api/exam/submit`

Submits exam answers and calculates score.

**Request:**
```json
{
  "email": "student@example.com",
  "answers": {
    "1": "C",
    "2": "B",
    ...
    "50": "C"
  }
}
```

**Response:**
```json
{
  "success": true,
  "score": 42,
  "totalQuestions": 50,
  "percentage": 84,
  "correctCount": 42,
  "incorrectCount": 8,
  "submittedAt": "2025-01-15T10:30:00Z",
  "message": "Exam submitted successfully! You scored 42 out of 50 (84%)"
}
```

### 3. Get Exam Results
**POST** `/api/exam/results`

Retrieves exam results for a student.

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "completed": true,
  "score": 42,
  "totalQuestions": 50,
  "percentage": 84,
  "submittedAt": "2025-01-15T10:30:00Z",
  "answers": {
    "1": "C",
    "2": "B",
    ...
  }
}
```

---

## Admin Management

### Admin Endpoints

#### 1. Grant Exam Access
**POST** `/api/admin/exam/grant-access`

```json
{
  "studentId": "uuid-here",
  "adminId": "admin-uuid" // optional
}
```

#### 2. Revoke Exam Access
**POST** `/api/admin/exam/revoke-access`

```json
{
  "studentId": "uuid-here"
}
```

#### 3. Get Exam Access List
**GET** `/api/admin/exam/access-list`

Returns list of all students with their exam access status.

### Admin UI

Located in Admin Dashboard (`/admin`), the "Final Exam Management" section shows:

- Student name and email
- Cohort
- Chapter 21 completion status
- Exam access status
- Exam score (if completed)
- Actions: Grant/Revoke access

**Filter:** Only shows students who have completed Chapter 21.

---

## Student Dashboard Integration

The student dashboard (`/dashboard`) displays exam status in the **Certification Progress** section:

### Display States:

1. **Exam Completed:**
   - Shows score: `42/50 (84%)`
   - Green checkmark if score ≥ 35 (70%)

2. **Access Granted (Not Taken):**
   - Shows "Take Exam →" link
   - Links to `/exam`

3. **Chapter 21 Completed (No Access):**
   - Shows "Waiting for access"
   - Admin must grant access

4. **Chapter 21 Not Completed:**
   - Shows "Complete Chapter 21 first"
   - Links to chapters page

### Certification Requirement

The exam is one of 5 certification requirements:
- ✅ Complete all 20 chapters
- ✅ Complete all 4 assignments
- ✅ Attend at least 80% of live sessions
- ✅ Earn at least 500 sats
- ✅ **Pass final exam (70% required = 35/50)**

---

## Exam Questions

All 50 questions are stored in:
```
src/content/examQuestions.ts
```

Each question includes:
- Question text
- 4 answer options (A, B, C, D)
- Correct answer

**Note:** Students never see the correct answers until after submission. The exam page only shows their selected answers and final score.

---

## Scoring

- **Total Questions:** 50
- **Passing Score:** 35/50 (70%)
- **Scoring Method:** 1 point per correct answer
- **Percentage:** `(score / 50) * 100`

---

## Security Features

1. **RLS Enabled** - Row Level Security on all exam tables
2. **API-Only Access** - No direct client access to database
3. **Single Submission** - Each student can only take exam once
4. **Access Control** - Requires Chapter 21 completion + admin approval
5. **Answer Validation** - Server-side validation before storing

---

## Workflow

### Student Workflow:

1. Complete Chapter 21
2. Wait for admin to grant exam access
3. Navigate to `/exam` (or click link in dashboard)
4. Answer all 50 questions
5. Submit exam
6. View results (score displayed immediately)
7. Results stored in database

### Admin Workflow:

1. Go to Admin Dashboard (`/admin`)
2. Navigate to "Final Exam Management" section
3. See list of students who completed Chapter 21
4. Click "Grant Access" for eligible students
5. View exam scores after students complete exam

---

## Testing

### Test Exam Access:

```bash
# Check access
curl -X POST http://localhost:3000/api/exam/check-access \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com"}'
```

### Test Exam Submission:

```bash
# Submit exam (with all 50 answers)
curl -X POST http://localhost:3000/api/exam/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "answers": {
      "1": "C", "2": "B", ... "50": "C"
    }
  }'
```

---

## Files Created/Modified

### New Files:
- `supabase/add-exam-tables.sql` - Database schema
- `src/content/examQuestions.ts` - Exam questions data
- `src/app/exam/page.tsx` - Exam page component
- `src/app/api/exam/check-access/route.ts` - Access check API
- `src/app/api/exam/submit/route.ts` - Submit exam API
- `src/app/api/exam/results/route.ts` - Get results API
- `src/app/api/admin/exam/grant-access/route.ts` - Grant access API
- `src/app/api/admin/exam/revoke-access/route.ts` - Revoke access API
- `src/app/api/admin/exam/access-list/route.ts` - Access list API

### Modified Files:
- `src/app/admin/page.tsx` - Added exam management UI
- `src/components/StudentDashboard.tsx` - Added exam status display

---

## Next Steps

1. **Run Database Migration:**
   - Go to Supabase SQL Editor
   - Run `supabase/add-exam-tables.sql`

2. **Test Access Control:**
   - Complete Chapter 21 as a student
   - Grant access as admin
   - Take exam

3. **Verify Results:**
   - Check exam score in student dashboard
   - Verify results stored in database
   - Check admin can see scores

---

## Notes

- ⚠️ **One-time submission:** Students can only take the exam once
- ⚠️ **No answer review:** Students don't see correct answers, only their score
- ⚠️ **Admin required:** Even after Chapter 21, admin must grant access
- ✅ **Automatic scoring:** Score calculated automatically on submission
- ✅ **Database sync:** Score stored in both `exam_results` and `students` tables
