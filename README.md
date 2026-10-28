# STEM-challenge-hub
TEAM A
# STEM Challenge Hub

A lightweight, mobile-friendly web app where K-12 teachers post short STEM challenges, students submit answers, and teachers see class progress.

Built by a Judson University student team as part of the **Fall 2026 APS Data Technologies Internship** (Oct 26 – Dec 11, 2026).

🔗 **Live app:** _coming soon (Vercel link)_
🎨 **Figma:** _link coming soon_

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
| 1 | **Sign in with two roles** | Teacher and student accounts. Teachers land on *My classes*; students land on *My challenges*. Students can't open teacher pages. |
| 2 | **Create a challenge** | Teachers create, edit and delete challenges with a subject (Science, Technology, Engineering, Math), grade band and answer type (multiple choice or short answer). |
| 3 | **Join a class** | Each class gets a unique ~6-character join code. Students enter it to see that class's challenges. |
| 4 | **Submit answers** | Students answer challenges and get instant "correct" / "try again" feedback on multiple choice. Short answers are saved for the teacher. |
| 5 | **Teacher progress view** | A table with one row per student and one column per challenge: not started, completed, correct or incorrect. |
| 6 | **Live on the web** | Public link that works on phone, tablet and laptop (Chrome and Safari). |

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

- **Grading happens in the database.** The correct answer lives in a separate `challenge_keys` table that students can't read. The `submit_answer` function checks the answer and returns correct/incorrect, so the answer key is never sent to the student's browser.
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

In the Supabase SQL editor, run the SQL files in `/supabase` to create the tables, row-level security policies and database functions. Running them on an empty project recreates everything.

### 4. Load the fictional seed data

Run the seed script in `/supabase` to load 2 teachers, 3 classes, 15 fictional students and a set of original sample challenges.

**Demo accounts:** _listed here once seed data is final (e.g. `teacher1@example.com`)_

### 5. Run locally

```bash
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

### Deploying

Merging a pull request into `main` redeploys the live app on Vercel automatically. Every PR also gets a preview link.

## Database

Supabase / Postgres. Row-level security (RLS) is **on for every table**.

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `profiles` | One row per user | `id`, `role` (teacher / student), `display_name`, `created_at` |
| `classes` | A teacher's class | `id`, `teacher_id`, `name`, `join_code` (unique), `created_at` |
| `enrollments` | Students in each class | `class_id`, `student_id`, `joined_at` (no duplicates) |
| `challenges` | A STEM challenge in one class | `id`, `class_id`, `created_by`, `title`, `prompt`, `subject`, `grade_band`, `answer_type`, `choices`, `is_published`, `created_at` |
| `challenge_keys` | Correct answers (students have no access) | `challenge_id`, `correct_choice` |
| `submissions` | A student's answer | `id`, `challenge_id`, `student_id`, `answer`, `is_correct`, `submitted_at` |

### Access rules (summary)

| Table | Teacher can | Student can |
|-------|-------------|-------------|
| `profiles` | Read/edit own; read names of students in their classes | Read/edit own only |
| `classes` | Create; read/edit/delete own classes | Read classes they're enrolled in |
| `enrollments` | Read and remove for own classes | Read own (join only via `join_class`) |
| `challenges` | Full control in own classes | Read published challenges in their classes |
| `challenge_keys` | Create/read/edit for own classes | **No access** |
| `submissions` | Read for own classes | Create and read own only |

### Database functions

- `join_class(code)`: adds the signed-in student to the class with that code. A wrong code returns an error; joining twice does nothing.
- `submit_answer(challenge_id, answer)`: saves the answer and, for multiple choice, returns correct or incorrect without exposing the key.

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
