# Sats Rewards Tracking - All Places Where Sats Are Offered

This document tracks all locations on the website where sats rewards are mentioned, displayed, or can be earned.

## 📊 Database Structure

**Table: `sats_rewards`**

### Core Fields
- `id` (UUID) - Primary key
- `student_id` (UUID) - References `profiles(id)` - The student who earned the reward
- `amount_paid` (INTEGER) - Amount in sats that has been paid
- `amount_pending` (INTEGER) - Amount in sats pending payment
- `reason` (TEXT) - Reason for the reward (human-readable description)
- `created_at` (TIMESTAMP) - When the reward was created
- `updated_at` (TIMESTAMP) - When the reward was last updated

### Option 1: Minimal Tracking Fields (✅ Added)
- `status` (TEXT) - Payment state: `pending`, `processing`, `paid`, or `failed`
- `payment_date` (TIMESTAMP) - When sats were actually paid out
- `awarded_by` (UUID) - References `profiles(id)` - Admin/mentor who awarded the sats (audit trail)
- `reward_type` (TEXT) - Category: `assignment`, `chapter`, `discussion`, `peer_help`, `project`, `attendance`, or `other`

### Option 3: Related Entities (✅ Added)
- `related_entity_type` (TEXT) - Type of entity: `assignment`, `chapter`, `event`, `discussion`, `project`, or `other`
- `related_entity_id` (UUID) - ID of the related entity (assignment ID, event ID, chapter number, etc.)

### Indexes
- `idx_sats_rewards_student_status` - For querying by student and status
- `idx_sats_rewards_type` - For querying by reward type
- `idx_sats_rewards_created` - For querying recent rewards
- `idx_sats_rewards_related_entity` - For finding rewards for specific entities
- `idx_sats_rewards_awarded_by` - For admin audit trails

---

## 🎯 Pages/Components Where Sats Are Mentioned or Offered

### 1. **Student Dashboard** (`src/components/StudentDashboard.tsx`)

#### A. Sats Wallet Section
- **Location**: Overview tab → Achievements & Sats Wallet card
- **Displays**:
  - Total Earned: `satsTotals.paid`
  - Pending Rewards: `satsTotals.pending`
  - Withdraw button (LNURL)
- **Data Source**: `/api/sats` endpoint

#### B. Progress Overview
- **Location**: Overview tab → Progress Overview card
- **Displays**: "Sats Earned" metric
- **Shows**: `satsEarned` value

#### C. Certification Section
- **Location**: Certification tab
- **Requirement**: "Earn at least 500 sats"
- **Shows**: Current sats earned vs required (500)
- **Status**: ✓ (green) if `satsEarned >= 500`, ✗ (red) otherwise

#### D. Leaderboard
- **Location**: Leaderboard tab
- **Displays**: Student sats in leaderboard table
- **Data Source**: `/api/leaderboard` endpoint

---

### 2. **Home Page** (`src/app/page.tsx`)

#### A. Step 4 in Learning Journey
- **Text**: "Earn sats + certificate"
- **Description**: "Get rewarded with Bitcoin and earn your certificate"
- **Location**: Hero section learning steps

#### B. Statistics Section
- **Displays**: "Sats rewarded" (static/mock data)
- **Location**: Impact statistics section

#### C. Main Description
- **Text**: "Learn by doing, earn sats, and become part of a growing community of builders"
- **Location**: Hero section

---

### 3. **Blog Page** (`src/app/blog/page.tsx`)

#### Blog Post Cards
- **Displays**: Sats amounts on each blog post card
- **Examples**: 5,000 sats, 3,200 sats, 4,500 sats, etc.
- **Note**: These appear to be mock/display data, not actual rewards
- **Location**: Blog post preview cards

---

### 4. **Blog Post Page** (`src/app/blog/[id]/page.tsx`)

#### Sats Tipping Feature
- **Location**: Bottom of blog post
- **Feature**: "Support the Author" section
- **Button**: "⚡ Tip 1,000 sats"
- **Description**: "Tip the author with sats via Lightning Network"
- **Note**: Currently a UI element - needs Lightning Network integration
- **Action**: Users can tip blog authors (not students earning rewards)

---

### 5. **Donate Page** (`src/app/donate/page.tsx`)

#### A. What Donations Support
- **Text**: "Reward students with sats for completing assignments and projects"
- **Location**: Donation benefits list

#### B. Donation Allocation
- **Text**: "Student Rewards: 50% of donations go directly to student sats rewards"
- **Location**: Donation breakdown section

---

### 6. **FAQ Page** (`src/app/faq/page.tsx`)

#### How Sats Rewards Work
- **Question**: "How do sats rewards work?"
- **Answer**: "Students earn sats for completing assignments, participating in discussions, and helping peers. Rewards are distributed via Lightning Network. You'll need a Lightning wallet to receive rewards."
- **Location**: FAQ section

---

### 7. **Impact Page** (`src/app/impact/page.tsx`)

#### A. Sats Reward Economy Section
- **Displays**:
  - Sats Earned: 150,000+ (static/mock)
  - Sats Spent: 120,000+ (static/mock)
  - Sats Circulated: 270,000+ (static/mock)
- **Location**: Impact statistics section

#### B. Testimonials
- **Quote**: "I've completed all assignments and earned 5,000 sats!"
- **Location**: Student testimonials section

---

## 🔄 API Endpoints

### 1. `/api/sats` (`src/app/api/sats/route.ts`)
- **Method**: GET
- **Purpose**: Fetch total sats for a student
- **Returns**: 
  ```json
  {
    "totalPaid": number,
    "totalPending": number
  }
  ```
- **Data Source**: `sats_rewards` table (sums all records)

### 2. `/api/leaderboard` (`src/app/api/leaderboard/route.ts`)
- **Method**: GET
- **Purpose**: Fetch leaderboard with student sats
- **Returns**: Array of students with sats totals
- **Data Source**: `sats_rewards` table (grouped by student)

---

## 📝 Actions That Should Earn Sats (Based on FAQ/Content)

Based on the FAQ answer and website content, students should earn sats for:

1. ✅ **Completing Assignments**
   - **Status**: Mentioned in FAQ
   - **Implementation**: Not yet implemented
   - **Suggested Amount**: TBD

2. ✅ **Participating in Discussions**
   - **Status**: Mentioned in FAQ
   - **Implementation**: Not yet implemented
   - **Suggested Amount**: TBD

3. ✅ **Helping Peers**
   - **Status**: Mentioned in FAQ
   - **Implementation**: Not yet implemented
   - **Suggested Amount**: TBD

4. ✅ **Completing Projects**
   - **Status**: Mentioned on Donate page
   - **Implementation**: Not yet implemented
   - **Suggested Amount**: TBD

5. ✅ **Completing Chapters**
   - **Status**: Not explicitly mentioned but logical
   - **Implementation**: Not yet implemented
   - **Suggested Amount**: TBD

6. ✅ **Attending Live Sessions**
   - **Status**: Not explicitly mentioned but logical
   - **Implementation**: Not yet implemented
   - **Suggested Amount**: TBD

---

## 🎯 Certification Requirement

- **Requirement**: Earn at least 500 sats
- **Location**: Certification Progress section
- **Current Status**: Tracks `satsTotals.paid`
- **Database**: Uses `sats_rewards.amount_paid` sum

---

## 🔧 Implementation Status

### ✅ Implemented
- Database table (`sats_rewards`)
- API endpoints (`/api/sats`, `/api/leaderboard`)
- Display of sats in dashboard
- Certification requirement tracking

### ❌ Not Yet Implemented
- Admin interface to award sats
- Automatic sats rewards for:
  - Assignment completion
  - Chapter completion
  - Discussion participation
  - Peer help
  - Project completion
  - Live session attendance
- Lightning Network integration for payments
- Sats withdrawal functionality
- Blog post tipping (Lightning integration)

---

## 📋 Next Steps for Sats Database Implementation

1. **Create Admin API** to award sats:
   - `/api/admin/sats/award` - Award sats to students
   - `/api/admin/sats/bulk-award` - Award sats to multiple students
   - `/api/admin/sats/history` - View sats reward history

2. **Add Automatic Rewards**:
   - When assignment is marked complete
   - When chapter is marked complete
   - When student attends live session (if tracking enabled)
   - When student helps peer (if peer-help system exists)

3. **Add Reason Field Usage**:
   - Update `sats_rewards.reason` with specific reason:
     - "Assignment completion: [assignment_name]"
     - "Chapter completion: [chapter_number]"
     - "Live session attendance: [session_date]"
     - "Peer help: [description]"
     - "Project completion: [project_name]"

4. **Lightning Network Integration**:
   - Integrate Lightning wallet for payments
   - Add withdrawal functionality
   - Add blog post tipping functionality

5. **Update User Data API**:
   - Add `satsEarned` to `userData.student` object
   - Calculate from `sats_rewards` table

---

## 📊 Current Data Flow

```
sats_rewards table
    ↓
/api/sats endpoint (sums amount_paid and amount_pending)
    ↓
StudentDashboard component (displays satsTotals)
    ↓
Displayed in:
- Sats Wallet card
- Progress Overview
- Certification section
- Leaderboard
```

---

## 🎨 UI Components Using Sats

1. **Sats Wallet Card** - Shows earned and pending
2. **Progress Overview** - Shows sats earned metric
3. **Certification Progress** - Shows requirement status
4. **Leaderboard Table** - Shows student rankings by sats
5. **Blog Post Cards** - Shows sats amounts (mock data)
6. **Blog Post Tipping** - UI for tipping authors (needs integration)

---

## 📝 Notes

- The `sats_rewards` table exists and is functional
- Current implementation fetches totals but doesn't have admin interface to award sats
- Most sats displays are either:
  - Connected to database (dashboard, leaderboard)
  - Static/mock data (blog posts, impact page)
  - UI placeholders (blog tipping, withdrawal button)
- Certification requirement of 500 sats is tracked but no automatic rewards system exists yet
