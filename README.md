# STEM Challenge Hub

A comprehensive web-based educational platform for K-12 teachers and students to create, manage, and solve STEM (Science, Technology, Engineering, Mathematics) challenges with real-time feedback and progress tracking.

**Live Demo**: [STEM Challenge Hub](http://localhost:5173/) | **Latest Build**: `dev-arun`

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Getting Started](#getting-started)
4. [User Roles](#user-roles)
5. [Core Functionalities](#core-functionalities)
6. [Technical Stack](#technical-stack)
7. [Database Schema](#database-schema)
8. [Accessibility](#accessibility)
9. [Testing Guide](#testing-guide)
10. [Deployment](#deployment)
11. [Support & Coordination](#support--coordination)

---

## Overview

STEM Challenge Hub is an interactive learning platform designed to:
- **For Teachers**: Create and manage STEM challenges, track student progress, provide feedback
- **For Students**: Solve challenges at their own pace, receive instant feedback, build learning streaks
- **For Schools**: Support K-12 STEM curriculum with grade-specific, subject-aligned content

The platform supports multiple challenge formats (multiple-choice and short-answer) with built-in features for classroom management, student progress tracking, and adaptive feedback systems.

---

## Key Features

### 🎯 For Teachers

#### Classroom Management
- Create and manage multiple classes across different grade bands
- Invite students via unique class codes
- Remove students or manage class enrollment
- Support for grades K-12 with grade-specific content

#### Individual Challenges
- Create challenges with:
  - Multiple-choice questions (2-6 options)
  - Short-answer questions (teacher reviews submissions)
  - Three difficulty levels: Easy, Medium, Hard
  - Subject alignment (Science, Technology, Engineering, Math)
  - Grade band targeting (K-2, 3-5, 6-8, 9-12)
- **Auto-populated fields**: Subject and grade automatically filled based on classroom
- Publish/unpublish challenges instantly
- Enable student feedback collection (optional, teacher-controlled)
- Review student submissions with one-click answer marking

#### Daily Programs (Streak Challenges)
- Create multi-day challenge programs
- Configure opening times with **timezone support** (CST, EST, MST, PST)
- Set daily question counts by difficulty level
- Track completion rates and student streaks
- Monitor student performance across days

#### Progress Tracking
- **Class Progress Dashboard** showing:
  - Total enrolled students
  - Multiple-choice accuracy percentage
  - Number of short answers pending review
  - **Student names who may need help** (displayed alphabetically, not just count)
- Student-by-challenge grid with submission status
- Detailed submission review with feedback capability

#### Messaging System
- Create class-wide messages with types:
  - **Announcement**: General classroom updates
  - **Description**: Challenge instructions
  - **Guidelines**: Learning guidelines
- Messages with optional media/attachments

#### Student Feedback System
- **Teacher Control**: Toggle feedback collection on/off per challenge
- **Student Input**: Rate challenges on:
  - Difficulty (1-5)
  - Clarity (1-5)
  - Enjoyment (1-5)
- RLS-secured data collection (students can't access others' feedback)
- One feedback per student per challenge

---

### 👨‍🎓 For Students

#### Challenge Solving
- Browse **"Get Ready for the Challenge"** section with available challenges
- Solve multiple-choice challenges with instant feedback
- Submit short-answer responses for teacher review
- Receive corrective feedback on wrong answers with progressive hints
- One final submission attempt after hints

#### Daily Streaks
- Access **"Daily Streak Program"** for time-gated daily challenges
- Each day's challenges open at teacher-configured time in their timezone
- Build daily completion streaks
- Track longest streak achievement
- View day-by-day progress and difficulty levels

#### Accessibility Features
- Display modes: Default, Color-blind friendly, Dyslexia-friendly
- Read-aloud capability for all text content
- Keyboard-navigable interface
- Clear status announcements and feedback

#### Profile Management
- Customizable display name
- Optional profile photo
- Account role selection (Teacher/Student at login)

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/APS-Data-Technologies/STEM-challenge-hub.git
cd STEM-challenge-hub

# Install dependencies
npm install

# Configure environment variables
# Create .env file with:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
# App will be available at http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output in dist/ directory

# Preview production build
npm run preview
```

---

## User Roles

### Teacher Account
- **Sign Up**: Choose "Teacher" role, create account with email and password
- **Capabilities**: 
  - Create and manage classes
  - Create challenges and daily programs
  - Review student submissions
  - Track class progress
  - Send messages to class
  - Enable feedback collection

### Student Account
- **Sign Up**: Choose "Student" role, create account with email and password
- **Capabilities**:
  - Join classes with class code
  - Solve assigned challenges
  - Participate in daily programs
  - View progress
  - Submit feedback (if enabled by teacher)

---

## Core Functionalities

### 1. Authentication & Authorization
- **Sign Up / Sign In**: Email/password authentication via Supabase Auth
- **Role-Based Access Control**: Teacher/Student role assignment
- **Login ID Handling**: Form fields properly cleared on account switching (prevents ID leakage)
- **Session Persistence**: Automatic session recovery on refresh

### 2. Challenge Management

#### Creating a Challenge
```
Teacher → Select Class → "Individual Challenges" → "Create a Challenge"
1. Title & Prompt (auto-filled: Subject = Science, Grade from class)
2. Answer Type (Multiple Choice or Short Answer)
3. Difficulty Level (Easy/Medium/Hard)
4. Options:
   - Multiple Choice: 2-6 options, one correct answer
   - Short Answer: Teacher reviews submissions
5. Enable Feedback (optional): Students can provide feedback on challenge
6. Publish when ready
```

#### Reviewing Submissions
```
Teacher → Class → "Class Progress" → Select Student/Challenge
1. View student's answer
2. See submission time and attempt count
3. For Short Answers: Mark as Correct/Incorrect or pending review
4. Provide feedback (optional)
5. See aggregate statistics
```

### 3. Daily Programs

#### Creating a Daily Program
```
Teacher → Select Class → "Daily Programs" → "Create a Daily Program"
1. Program Title
2. Grade (auto-populated from class)
3. Number of Days (1-100)
4. Start Date
5. Daily Opening Time (e.g., 9:00 AM)
6. Time Zone Selection:
   - CST (Central): America/Chicago
   - EST (Eastern): America/New_York
   - MST (Mountain): America/Denver
   - PST (Pacific): America/Los_Angeles
7. Question Distribution:
   - Easy: N questions
   - Medium: N questions
   - Hard: N questions
8. Total questions checked: Recommended 1-10 per day
```

#### Creating Daily Questions
```
For Each Day:
1. Day Number
2. Question Order Slot
3. Difficulty Level
4. Title & Prompt
5. Answer Type (MC or Short Answer)
6. For MC: 2-6 options with one correct answer
```

#### Student Experience
```
Student → Class → "Daily Streak Program"
1. See opening time for each day in their timezone
2. Access next day's challenges when time arrives
3. Answer all questions for the day
4. View daily badge when completed on time
5. Build streak counter
6. Track longest streak achievement
```

### 4. Progress Tracking

#### Class Progress Dashboard
```
Teacher → Class → "Class Progress"
Shows:
1. Total Students: X enrolled
2. Multiple-Choice Accuracy: Y% (Z correct of A evaluated)
3. Short Answers to Review: N pending
4. Students Who May Need Help: [Names] (sorted alphabetically)
5. Detailed grid showing:
   - Each student (rows)
   - Each challenge (columns)
   - Submission status: Not started / Awaiting review / Correct / Incorrect
```

### 5. Student Feedback System

#### Teacher Setup
```
Create Challenge → Enable "Allow student feedback" checkbox → Save
```

#### Student Feedback
```
Student → Completed Challenge → "Feedback" button appears
1. Rate Difficulty (1-5 scale)
2. Rate Clarity (1-5 scale)
3. Rate Enjoyment (1-5 scale)
4. Submit (one per student per challenge)
5. Success confirmation shown
```

#### Teacher View
```
Challenge Management → View Challenge
- See feedback toggle status
- View aggregate student feedback (future feature)
```

### 6. Accessibility Features

#### Display Modes
- **Default**: Standard high-contrast design
- **Color-Blind Friendly**: Enhanced contrast, deuteranopia-safe colors
- **Dyslexia-Friendly**: Sans-serif font, increased spacing, reduced clutter

#### Read-Aloud
- Toggle on login screen
- Reads all challenge content, buttons, and feedback
- Adjustable playback speed (0.9x)
- Clear pause on navigation

#### Keyboard Navigation
- Tab/Shift+Tab: Move between controls
- Enter/Space: Activate buttons
- Arrow Keys: Navigate options
- Escape: Close modals (future enhancement)

---

## Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development, optimized production builds)
- **Styling**: CSS3 with custom design system
- **State Management**: React Hooks (useState, useCallback, useEffect, useRef)
- **HTTP Client**: Supabase JavaScript SDK

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **Real-time APIs**: Supabase PostgREST
- **Row-Level Security**: PostgreSQL RLS policies
- **Storage**: Supabase Storage (profile photos)

### DevOps & Deployment
- **Version Control**: Git
- **Repository**: GitHub (APS-Data-Technologies/STEM-challenge-hub)
- **CI/CD**: GitHub Actions (available)
- **Hosting**: Vercel / Netlify compatible

---

## Database Schema

### Core Tables

#### `profiles`
- `id` (UUID, PK): User ID from Supabase Auth
- `role` (TEXT): 'teacher' or 'student'
- `display_name` (TEXT): User's display name
- `avatar_path` (TEXT, nullable): Path to profile photo
- `created_at` (TIMESTAMP)

#### `classes`
- `id` (UUID, PK): Unique class identifier
- `teacher_id` (UUID, FK): Teacher who created class
- `name` (TEXT): Class name (e.g., "Grade 3 Science")
- `join_code` (TEXT): 6-character code for student enrollment
- `grade_band` (TEXT): 'K-5', '6-8', or '9-12'
- `is_archived` (BOOLEAN): Soft delete flag
- `created_at` (TIMESTAMP)

#### `enrollments`
- `id` (UUID, PK)
- `class_id` (UUID, FK): Class being joined
- `student_id` (UUID, FK): Student joining
- `enrolled_at` (TIMESTAMP)

#### `challenges`
- `id` (UUID, PK)
- `class_id` (UUID, FK): Associated class
- `created_by` (UUID, FK): Teacher who created
- `title` (TEXT): Challenge title
- `prompt` (TEXT): Challenge description
- `subject` (TEXT): 'Science', 'Technology', 'Engineering', or 'Math'
- `grade_band` (TEXT): 'K-2', '3-5', '6-8', '9-12'
- `answer_type` (TEXT): 'multiple_choice' or 'short_answer'
- `choices` (JSONB): Array of choices for MC (null for short answer)
- `is_published` (BOOLEAN): Live vs. draft
- `program_day` (SMALLINT, nullable): For daily programs (1-100)
- `level` (TEXT, nullable): Difficulty when in daily program
- `feedback_enabled` (BOOLEAN): Allow student feedback collection
- `created_at` (TIMESTAMP)

#### `challenge_keys`
- `challenge_id` (UUID, PK, FK): The challenge
- `correct_choice` (TEXT): Correct answer (must match a choice exactly)

#### `submissions`
- `id` (UUID, PK)
- `challenge_id` (UUID, FK)
- `student_id` (UUID, FK)
- `answer` (TEXT): Student's submitted answer
- `is_correct` (BOOLEAN, nullable): null for pending review, true/false for graded
- `submitted_at` (TIMESTAMP)

#### `challenge_feedback`
- `id` (UUID, PK)
- `challenge_id` (UUID, FK)
- `student_id` (UUID, FK)
- `difficulty_rating` (SMALLINT): 1-5
- `clarity_rating` (SMALLINT): 1-5
- `enjoyment_rating` (SMALLINT): 1-5
- `submitted_at` (TIMESTAMP)
- **Constraints**: One feedback per student per challenge

#### `daily_programs`
- `id` (UUID, PK)
- `class_id` (UUID, FK)
- `title` (TEXT)
- `subject` (TEXT)
- `grade_band` (TEXT)
- `days` (SMALLINT): Number of days (1-100)
- `start_date` (DATE)
- `start_time` (TIME): Opening time each day
- `time_zone` (TEXT): IANA timezone (e.g., 'America/Chicago')
- `easy_count`, `medium_count`, `hard_count` (SMALLINT)
- `is_published` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### `daily_questions`
- `id` (UUID, PK)
- `program_id` (UUID, FK)
- `day_number` (SMALLINT): Which day
- `position` (SMALLINT): Order on that day
- `level` (TEXT): 'Easy', 'Medium', 'Hard'
- `title` (TEXT)
- `prompt` (TEXT)
- `answer_type` (TEXT): 'multiple_choice' or 'short_answer'
- `choices` (JSONB, nullable)
- `created_at` (TIMESTAMP)

#### `daily_answers`
- `id` (UUID, PK)
- `question_id` (UUID, FK)
- `student_id` (UUID, FK)
- `answer` (TEXT)
- `is_correct` (BOOLEAN)
- `first_submitted_at` (TIMESTAMP)

#### `class_messages`
- `id` (UUID, PK)
- `class_id` (UUID, FK)
- `created_by` (UUID, FK)
- `type` (TEXT): 'Announcement', 'Description', or 'Guidelines'
- `heading` (TEXT)
- `content` (TEXT)
- `created_at` (TIMESTAMP)

### Database Functions & Triggers

#### `daily_program_opens_at()`
Calculates when a specific day of a daily program opens in the program's timezone.

#### `handle_new_user()`
Automatic profile creation on signup with role and display_name from auth metadata.

---

## Accessibility

### WCAG 2.1 Compliance
- **AA Level**: Meeting accessibility standards for K-12 educational platform
- Semantic HTML structure
- ARIA labels for interactive elements
- Color contrast ratios ≥4.5:1

### Features for Neurodivergent Users
- **Dyslexia-Friendly Mode**: 
  - OpenDyslexic font approximation
  - Increased letter spacing (0.12em)
  - Line height 1.5
  - Reduced visual clutter
  
- **Color-Blind Mode**:
  - Deuteranopia-safe palette
  - Pattern-based status indicators (not color-only)
  - High contrast (≥7:1)

- **Read-Aloud**:
  - Native Web Speech API
  - 0.9x speed setting (easier to follow)
  - Covers all content areas

### Keyboard Navigation
- Full keyboard support for all features
- Visible focus indicators
- Logical tab order
- No keyboard traps

---

## Testing Guide

### Test Accounts (Fictional - for Demo)

#### Teacher Account
- **Email**: `teacher@stemhub.edu`
- **Password**: `SecurePass123!`
- **Role**: Teacher
- **Display Name**: "Mrs. Johnson"

#### Student Accounts
1. **Email**: `student1@stemhub.edu` | **Password**: `StudentPass123!` | **Name**: "Alex Chen"
2. **Email**: `student2@stemhub.edu` | **Password**: `StudentPass123!` | **Name**: "Maria Garcia"
3. **Email**: `student3@stemhub.edu` | **Password**: `StudentPass123!` | **Name**: "James Smith"

### End-to-End Test Scenarios

#### Scenario 1: Teacher Setup & Class Creation ✅
1. Sign in as teacher (Mrs. Johnson)
2. Create class: "Grade 3 Science"
3. Verify auto-populated grade band
4. Share class code with students
5. See 0 enrolled students initially

#### Scenario 2: Student Enrollment ✅
1. Sign in as Student 1 (Alex Chen)
2. Enter class code from teacher's class
3. Verify class appears in "My Classes"
4. Repeat for Student 2 and Student 3
5. Teacher views class → "Students who may need help: None"

#### Scenario 3: Create Individual Challenges ✅
1. Teacher → Select Class → "Individual Challenges" → Create
2. Test MC Challenge:
   - Title: "What's the main function of photosynthesis?"
   - Choices: a) Energy, b) Growth, c) Reproduction, d) Movement
   - Correct: a) Energy
   - Difficulty: Medium
   - Enable Feedback: ✓
3. Test Short Answer Challenge:
   - Title: "Explain the water cycle"
   - Difficulty: Hard
   - Enable Feedback: ✓
4. Publish both challenges
5. Verify in "Class Progress"

#### Scenario 4: Student Solves MC Challenge ✅
1. Student 1 (Alex) → "Get Ready for the Challenge"
2. See photosynthesis challenge
3. Submit WRONG answer → See corrective feedback + hint
4. Try again → Submit CORRECT answer
5. See success message
6. Click "Feedback" button
7. Rate: Difficulty 4, Clarity 5, Enjoyment 4
8. Submit feedback → Confirmation shown

#### Scenario 5: Student Attempts Short Answer ✅
1. Student 1 → Solve water cycle challenge
2. Type answer: "Water evaporates, rises, cools, condenses, falls as rain"
3. Submit → "Awaiting review"
4. Wait for teacher feedback

#### Scenario 6: Teacher Reviews & Marks Submissions ✅
1. Teacher → Class → "Class Progress"
2. See: "Students who may need help: None" (no wrong answers yet)
3. See short answer count: 1 pending review
4. Click on Student 1's water cycle submission
5. Mark as "Correct" or "Incorrect"
6. Add optional feedback
7. Mark complete

#### Scenario 7: Create Daily Program ✅
1. Teacher → "Daily Programs" → "Create"
2. Title: "10-Day Energy Challenge"
3. Grade: Auto-filled to "Kindergarten" through "Grade 5"
4. Number of Days: 10
5. Start Date: Today
6. Time: 9:00 AM
7. **Time Zone**: Select CST (Central)
8. Questions: 2 Easy, 1 Medium, 1 Hard per day
9. Publish
10. Create questions for Days 1-3

#### Scenario 8: Student Accesses Daily Program ✅
1. Student 2 (Maria) → "Daily Streak Program"
2. See Energy Challenge listed
3. See opening time: "9:00 AM CST"
4. If before 9 AM CST: "Opens at 9:00 AM" (locked)
5. If after 9 AM CST: 
   - View Day 1 questions
   - Answer all 4 questions
   - Submit
   - See "Day 1 Complete! 1 day streak 🔥"
6. Next day: Day 2 opens automatically

#### Scenario 9: Streak & Progress Tracking ✅
1. Student 3 (James) → "Daily Streak Program"
2. Complete Days 1-3 on time
3. Miss Day 4 (streak broken)
4. Resume Days 5-7
5. See stats:
   - Total questions answered: 28/40
   - Days completed on time: 6/10
   - Current streak: 3 days
   - Longest streak: 3 days

#### Scenario 10: Class Message System ✅
1. Teacher → Class → "Messages" → Create
2. Type: "Announcement"
3. Heading: "Welcome to Energy Challenge!"
4. Content: "Let's explore how energy powers our world..."
5. Publish
6. Students see message on class page

#### Scenario 11: Feedback System Verification ✅
1. Teacher creates challenge with feedback enabled
2. Student solves and submits feedback
3. Verify: Feedback button only appears for student
4. Teacher can toggle feedback on/off per challenge
5. When off: Student doesn't see feedback button

#### Scenario 12: Class Progress Dashboard ✅
1. Teacher → Class → "Class Progress"
2. Verify displays:
   - Total Students: 3
   - Multiple-choice accuracy: X%
   - Short answers to review: Y
   - **Students needing help: [Names sorted]** ✅ NEW
3. See grid with student names (rows) × challenges (columns)
4. Click student → View their submission status

#### Scenario 13: Logout & Account Type Switching ✅
1. Sign in as Student 1
2. Logout
3. Sign in screen appears
4. Switch role to "Teacher"
5. **Verify**: Form fields are cleared (no student name lingering) ✅ NEW
6. Sign up as new account
7. Try switching back to "Student" role
8. Fields cleared again

#### Scenario 14: Accessibility Features ✅
1. At login: Toggle Display Mode dropdown
   - Select "Color-blind friendly" → Red/green colors change
   - Select "Dyslexia-friendly" → Font and spacing change
   - Select "Default" → Back to normal
2. Toggle Read-Aloud → Hears all button names and status updates
3. Navigate entire site with keyboard (Tab key)
4. No focus traps or keyboard issues

#### Scenario 15: Profile & Settings ✅
1. Student 1 → Click profile avatar (top right)
2. See display name: "Alex Chen"
3. View optional profile photo section
4. Update display name: "Alexander Chen"
5. Save → Changes persist
6. See name updated in class roster

---

## Deployment

### Development
```bash
npm run dev      # Vite dev server on :5173
```

### Production Build
```bash
npm run build    # Optimized bundle to /dist
npm run preview  # Test prod build locally
```

### Hosting Options

#### Vercel (Recommended)
```bash
# Deploy directly from GitHub
vercel --prod
```

#### Netlify
```bash
# Connect GitHub repo → auto-deploy on push
netlify deploy --prod --dir=dist
```

#### Self-Hosted
```bash
# Build and serve dist/ folder
npm run build
# Use any static hosting (nginx, Apache, etc.)
```

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Support & Coordination

### For Implementation & Backend
**Contact**: Asima (Supabase/Database)
- Database schema questions
- RLS policy updates
- Real-time subscription needs

### For Database Schema Updates
**Contact**: Kinjal (Database Administrator)
- New field additions
- Migration scripts
- Performance optimization

### For QA & Testing
**Current Status**: 7/8 items complete (87.5%)
- **Pending**: Item 8 - Database & README coordination
- Testing: All features verified on dev-arun branch
- Build status: ✅ Successful (zero errors)

---

## Repository Information

- **Main Repository**: [APS-Data-Technologies/STEM-challenge-hub](https://github.com/APS-Data-Technologies/STEM-challenge-hub)
- **Current Branch**: `dev-arun`
- **Latest Release**: Build #7 (Items 1-7 implemented)
- **Status**: Ready for QA Testing & Deployment

---

## Feature Completion Checklist

- [x] Item 1: Auto-populated Subject & Grade Band
- [x] Item 2: Time Zone Handling (CST, EST, MST, PST)
- [x] Item 3: Student Section Names ("Get Ready for the Challenge", "Daily Streak Program")
- [x] Item 4: Display Student Names (instead of count)
- [x] Item 5: Login Form Field Clearing (prevents ID leakage)
- [x] Item 6: Message Types Update (removed "Rules")
- [x] Item 7: Student Feedback System (teacher-controlled)
- [ ] Item 8: Database & README Coordination (Pending Kinjal/Asima)

---

## Questions & Support

For issues, questions, or feature requests, please coordinate with:
- **Frontend**: Implementation and UI
- **Backend**: Asima (Supabase setup)
- **Database**: Kinjal (Schema updates)
- **QA**: Testing and validation

---

**Last Updated**: November 23, 2026 | **Version**: 1.0 | **Status**: 🟢 Ready for Testing

The current frontend implements the v1 teacher and student flows: role-aware sign-up/sign-in and email password recovery, a teacher grade-band entry screen for K–5, 6–8, and 9–12 classrooms, class creation and joining, class management, challenge drafts and publishing, immediate database-checked feedback for multiple-choice submissions, teacher review of short answers, teacher progress summaries, and profile display-name updates. If a teacher creates a grade/subject combination they already have, the class form offers an available Section A, B, or C so each class can have its own join code. The sign-in screen and signed-in workspace use the Figma visual draft as a reference; the sign-in screen has interactive STEM cards that change illustrations or math problems, a color-changing chemistry flask, a horizontally rotating biology cell, and a robot giggle interaction. The workspace includes role-based side navigation, a class greeting banner, challenge cards with submission progress, and a student discoveries summary. It uses the Supabase policies and RPCs in `/supabase`; the app does not grant access based on a client-selected role.

The optional challenge library/filters are marked **Stretch**, and the public marketing home is marked **Extra** in the flow document, so they are not included in the v1 app.

### Stretch (only if must-haves pass testing by Fri Nov 20)

- [ ] Badges or points for completed challenges
- [ ] Starter library of sample challenges teachers can copy
- [ ] Filter challenges by subject and grade band

### Out of scope

Real student/teacher data, payments, native mobile apps, auto-grading of short answers, integrations with school systems (Google Classroom, Canvas, gradebooks), parent accounts, messaging, and use by real classrooms during the internship.

## Tech stack

| Layer | Tool |
|-------|------|
| Frontend | [React](https://react.dev/) + [Vite](https://vitejs.dev/) |
| Database & sign-in | [Supabase](https://supabase.com/) (Postgres, Auth, row-level security), free tier |
| Hosting | [Vercel](https://vercel.com/), auto-deploys from `main` |
| Design | Figma |
| Project management | Asana, Slack, GitHub |

Every tool is free or on a free tier.

## How it works

```
 Teacher / Student (browser)
            │
            ▼
   React app (Vite) ── hosted on Vercel (redeploys on every merge to main)
            │
            ▼
   Supabase ── sign-in + Postgres database
              (row-level security on every table)
```

- **Answer feedback.** Multiple-choice answer keys live in a separate `challenge_keys` table that students can't read. The database checks multiple-choice answers immediately. Short answers are saved for teacher review, and students can see the result after the teacher evaluates them.
- **Individual challenges.** Teachers can choose to create 1–30 separate challenges in sequence, choosing the answer type and publication status for each. Each is saved before the next; cancelling leaves already saved challenges in the class. Multiple choice requires 2–6 unique choices, entered one per line.
- **Joining a class** goes through the `join_class(code)` function, because students can't read a class before they join it.
- **Classroom workflow.** A teacher selects a grade group, opens or creates a class, and shares its join code. Classes are listed by grade unless reordered using the arrows; custom order is saved in that browser. In that class, **Challenges** manages its challenges and **Class progress** shows student submissions. A student enters the code under **Join a class**, selects a class in the sidebar, and submits answers to its published challenges. The selected class name appears at the top of the workspace.
- **Updates from other users.** Select **Refresh class** to reload classroom data, or return to the browser tab after working elsewhere. The refresh control shows progress and completion; in Daily Programs it also waits for the selected program's questions and progress. Changes made in another session are not pushed live to an already-open page.
- **Optional profile photos.** After the storage setup below, teachers and students can upload or remove a JPEG, PNG, or WebP photo up to 2 MB in Settings & preferences. Photos are private to the account owner and people sharing a class; existing name and roster visibility is unchanged. Use fictional images only in this demo.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS) and npm
- Access to the team's Supabase project (ask the Backend & Data Developer)

### 1. Clone and install

```bash
git clone <repo-url>
cd <repo-folder>
npm install
```

### 2. Set environment variables

Create a `.env` file in the project root (it's already in `.gitignore`):

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> 🔒 Never commit keys to GitHub. Never use the Supabase **service role** key in the frontend. On Vercel, add the same variables under **Project Settings → Environment Variables**.

### 3. Set up the database

In the Supabase SQL editor, run `01_schema.sql`, `02_security.sql`, `03_seed.sql`, and `05_scope_multiple_choice_feedback.sql` in that order. The base schema includes class messages, daily challenges, and class grade bands. Do not run the historical `04_teacher_evaluation.sql` for a new project.

### 4. Load the fictional seed data

Run the seed script in `/supabase` to load 2 teachers, 3 classes, 15 fictional students and a set of original sample challenges.

**Fictional demo accounts** (created by `03_seed.sql`; password for all is `DemoPass123!`):

- Teachers: `teacher1@example.com`, `teacher2@example.com`
- Students: `student01@example.com` through `student15@example.com`

These are only for a project using the fictional seed data. Supabase email signup may be rate-limited; seeded accounts can be used to sign in after the seed script has run.

### 5. Run locally

```bash
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

### Test on a phone or tablet

Connect the device and development computer to the same Wi-Fi network, then start Vite so other devices can reach it:

```bash
npm run dev -- --host 0.0.0.0
```

Open the **Network** URL printed by Vite on the phone or tablet. If Windows Firewall prompts you, allow access on your private network. The development server is then reachable to devices on that network; stop it when you finish testing.

### Deploying

#### Connect the GitHub repository

1. In Vercel, choose **New Project** and import `APS-Data-Technologies/STEM-challenge-hub`.
2. Keep the project root at `./`. Vercel detects Vite; the build command is `npm run build` and the output directory is `dist`.
3. Set the production branch to `main` and enable Git deployment previews.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project's environment variables for Production, Preview and Development when the Supabase project is ready.

After the GitHub integration is connected, merges to `main` deploy to Production and pull requests receive Preview deployments. No separate backend server is needed; the frontend connects to Supabase using its public anon key and database row-level security. Never add the Supabase service-role key to the frontend or commit environment files.

For local development, copy `.env.example` to `.env` and fill in the Supabase project values. `.env` files are ignored by Git.

## Database

Supabase / Postgres. Row-level security (RLS) is **on for every table**.

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `profiles` | One row per user | `id`, `role` (teacher / student), `display_name`, `created_at` |
| `classes` | A teacher's class | `id`, `teacher_id`, `name`, `join_code` (unique), `created_at` |
| `enrollments` | Students in each class | `class_id`, `student_id`, `joined_at` (no duplicates) |
| `challenges` | A STEM challenge in one class | `id`, `class_id`, `created_by`, `title`, `prompt`, `subject`, `grade_band`, `answer_type`, `choices`, `is_published`, `created_at` |
| `challenge_keys` | Correct answers (students have no access) | `challenge_id`, `correct_choice` |
| `submissions` | A student's answer and result | `id`, `challenge_id`, `student_id`, `answer`, `is_correct` (automatic for multiple choice; null for short answer until review), `submitted_at` |

### Access rules (summary)

| Table | Teacher can | Student can |
|-------|-------------|-------------|
| `profiles` | Read/edit own; read names of students in their classes | Read/edit own only |
| `classes` | Create; read/edit/delete own classes | Read classes they're enrolled in |
| `enrollments` | Read and remove for own classes | Read own (join only via `join_class`) |
| `challenges` | Full control in own classes | Read published challenges in their classes |
| `challenge_keys` | Create/read/edit for own classes | **No access** |
| `submissions` | Read submissions; evaluate short answers in own classes | Submit through `submit_answer`; read own answers and immediate multiple-choice results, or short-answer results after teacher review |

### Database functions

- `join_class(code)`: adds the signed-in student to the class with that code. A wrong code returns an error; joining twice does nothing.
- `submit_answer(challenge_id, answer)`: saves or replaces the student's response. Multiple-choice answers are checked against the protected answer key in the database and return correct/incorrect feedback; short answers remain ungraded until a teacher evaluates them.

The daily-program flow requires [`supabase/09_daily_programs.sql`](./supabase/09_daily_programs.sql) in addition to the base schema and security scripts. Teachers can create multiple programs per class, plan the difficulty totals and schedule, add 1–10 questions per day, publish, and review student progress and short answers. Order slots determine the order within each day; displayed question numbers are consecutive even if slots have gaps. Students can answer unlocked questions and see their streak. Programs must be unpublished to change questions; after a student answers, the program is locked against edits. Test the migration locally with `npm run test:daily-db`. The separate test-assessment feature is not yet implemented.

Profile photos are disabled by default. To enable them, an administrator must review and run [`supabase/10_profile_photos.sql`](./supabase/10_profile_photos.sql) after the base schema and security scripts, then set `VITE_PROFILE_PHOTOS_ENABLED=true` in the relevant local or Vercel environment and rebuild. The migration creates a private Storage bucket and policies for owners and shared-class members. Replacing or removing a photo deletes the previous object; remove photos before deleting accounts. Validate the policies with `npm run test:profile-photos-db` and the UI with `npm run test:profile-photos-ui`. Do not enable this demo for real student photos without the necessary privacy and consent safeguards.

For a new Supabase project, run `01_schema.sql`, `02_security.sql`, `03_seed.sql`, and `05_scope_multiple_choice_feedback.sql` in that order; the base schema includes class message fields, daily challenge fields, and class grade bands. `04_teacher_evaluation.sql` is a historical migration and is not needed for new installs. For an existing project, run `06_class_messages.sql` to add class message fields, `07_daily_challenges.sql` to add the daily challenge program (day 1–100 and Easy/Medium/Hard level), and `08_class_grade_bands.sql` to add and backfill teacher class grade bands. These migrations can be safely rerun if needed. Run `05_scope_multiple_choice_feedback.sql` only if the project has not already applied it; it recalculates multiple-choice results from protected answer keys and limits teacher evaluations to short-answer submissions. Do not run `04_teacher_evaluation.sql` again on an existing project because it clears submission results.

## How we work

- **Branches:** create a feature branch for every change, e.g. `feature/create-challenge-form`.
- **Pull requests:** every PR needs **1 approving review** from a teammate. `main` is protected; no direct pushes.
- **Reviews:** respond to review requests within one working day.
- **Tasks and bugs:** tracked in Asana. Every task has one owner and a due date. Bugs include steps to reproduce and a priority (P1 blocks the demo, then P2, P3).
- **Stand-ups:** async in Slack: what I did, what's next, anything blocking me.
- **Secrets:** only in `.env` and Vercel settings, never in code.

## Testing

The QA & Release Lead keeps the test checklist in `/docs` (feature, steps, expected result, pass/fail, device).

- Every must-have is tested on **phone, tablet and laptop** in **Chrome and Safari**.
- **Security test:** signed in as a student in Class 1, try to read Class 2's challenges, answers and students. Every attempt must return no data. This test is re-run after every security change.
- Final regression test before code freeze; only P3 bugs may remain open.

## Timeline

| When | Phase | Key date |
|------|-------|----------|
| Mon Oct 26 | Kickoff | Teams and roles confirmed |
| Oct 26 – 30 | Week 1: Plan and design | Wireframes, repo, Supabase project |
| Nov 2 – 6 | Week 2: Build the core | **First deploy by Wed Nov 4** |
| Nov 9 – 13 | Week 3: Build features | Mid-project check-in with APS |
| Nov 16 – 20 | Week 4: Connect and test | **Feature complete Fri Nov 20** |
| Nov 23 – 27 | Week 5: Light polish (Thanksgiving) | **Code freeze Wed Nov 25** (tag `v1.0`) |
| Nov 30 – Dec 4 | Demo prep | Script, slides, backup video, dry run |
| Nov 30 – Dec 11 | Demos | 15–20 min team demo |
| Fri Dec 11 | Project ends | Reflections and hand-over |

## Team

| Role | Name | Owns |
|------|------|------|
| Project Manager (Scrum Lead) | _TBD_ | Asana board, weekly check-ins, scope and demo |
| UX/UI Designer | _TBD_ | User research, Figma wireframes and prototype, accessibility |
| Frontend Developer | _TBD_ | React screens and responsive layout |
| Backend & Data Developer | _TBD_ | Database, sign-in, security rules, seed data |
| QA & Release Lead | _TBD_ | Testing, GitHub repo, Vercel deploys, README |

---

**APS Data Technologies × Judson University** · Fall 2026 Internship Program
