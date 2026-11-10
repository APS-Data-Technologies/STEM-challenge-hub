# STEM-challenge-hub
TEAM A
# STEM Challenge Hub

A lightweight, mobile-friendly web app where K-12 teachers post short STEM challenges, students submit answers, and teachers see class progress.

Built by a Judson University student team as part of the **Fall 2026 APS Data Technologies Internship** (Oct 26 – Dec 11, 2026).

🔗 **Live app:** _coming soon (Vercel link)_
🎨 **Figma:** [STEM Challenge Hub](https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=27-2&t=nVBc4dz7RhfkKLmz-1)

> ⚠️ **Demo project, fictional data only.** This app uses made-up teachers, students and classes (`@example.com` accounts). Never enter real student or teacher names, emails or records.

---

## Table of contents

- [The problem](#the-problem)
- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Database](#database)
- [How we work](#how-we-work)
- [Testing](#testing)
- [Timeline](#timeline)
- [Team](#team)

---

## The problem

Teachers want quick ways to give hands-on practice (a math puzzle, a science prediction, a coding logic question) and see who is getting it. Most tools are too complex or too expensive for a single classroom. STEM Challenge Hub keeps it simple.

**Users:** K-12 STEM teachers and their students.

## Features

### Must-haves (v1.0)

| # | Feature | What it does |
|---|---------|--------------|
| 1 | **Sign in with two roles** | Teacher and student accounts with email password recovery. Teachers land on *My classes*; students land on *My challenges*. Students can't open teacher pages. |
| 2 | **Create a challenge** | Teachers create, edit and delete challenges with a subject (Science, Technology, Engineering, Math), grade band and answer type (multiple choice or short answer). |
| 3 | **Join a class** | Each class gets a unique ~6-character join code. Students enter it to see that class's challenges. |
| 4 | **Submit answers** | Students get immediate correct/try-again feedback for multiple-choice answers. Short answers are saved for teacher review. |
| 5 | **Teacher progress view** | A table with one row per student and one column per challenge, showing not started, awaiting review for short answers, or correct/incorrect. |
| 6 | **Live on the web** | Public link that works on phone, tablet and laptop (Chrome and Safari). |

### Frontend coverage

The current frontend implements the v1 teacher and student flows: role-aware sign-up/sign-in and email password recovery, class creation and joining, class management, challenge drafts and publishing, immediate database-checked feedback for multiple-choice submissions, teacher review of short answers, teacher progress summaries, and profile display-name updates. The sign-in screen and signed-in workspace use the Figma visual draft as a reference; the sign-in screen includes an interactive STEM illustration with changing math problems, a color-changing chemistry flask, a horizontally rotating biology cell, and a robot giggle interaction. The workspace includes role-based side navigation, a class greeting banner, challenge cards with submission progress, and a student discoveries summary. It uses the Supabase policies and RPCs in `/supabase`; the app does not grant access based on a client-selected role.

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

- **Teachers evaluate submissions.** Multiple-choice answer keys live in a separate `challenge_keys` table that students can't read. Submitting an answer does not reveal correctness; only a teacher can evaluate that student's response. Students see the evaluation after the teacher records it.
- **Joining a class** goes through the `join_class(code)` function, because students can't read a class before they join it.

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

In the Supabase SQL editor, run `01_schema.sql`, `02_security.sql`, `03_seed.sql`, and `05_scope_multiple_choice_feedback.sql` in that order. Do not run the historical `04_teacher_evaluation.sql` for a new project.

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

For a new Supabase project, run `01_schema.sql`, `02_security.sql`, `03_seed.sql`, and `05_scope_multiple_choice_feedback.sql` in that order. `04_teacher_evaluation.sql` is a historical migration and is not needed for new installs. For an existing project, run `05_scope_multiple_choice_feedback.sql` once after its existing migrations; it recalculates multiple-choice results from the protected answer keys and limits teacher evaluations to short-answer submissions. Do not run `04_teacher_evaluation.sql` again on an existing project because it clears submission results.

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
