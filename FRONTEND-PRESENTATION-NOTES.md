# STEM Challenge Hub — Frontend Presentation Notes

## One-sentence explanation

STEM Challenge Hub helps teachers publish short STEM activities for a class, lets students join with a class code and submit answers, and gives teachers a view of class progress.

## Short introduction (about 30 seconds)

> “Our project is a lightweight classroom app for short STEM challenges. A teacher creates a class and shares its join code. The teacher can then create a challenge, save it as a draft, or publish it for that class. Students sign in, join with the code, and submit answers to published challenges. Multiple-choice answers receive immediate feedback, while teachers review short answers. Teachers can see student progress from their class dashboard.”

## Suggested demo walkthrough

1. **Sign in:** Show the sign-in page and explain that accounts have a teacher or student role. The app reads the role from the signed-in user’s Supabase profile.
2. **Teacher class view:** Show the teacher’s classes and choose one. The class join code is visible and can be copied.
3. **Create a challenge:** Enter a title and prompt, choose a subject and grade band, then select multiple choice or short answer.
   - Multiple choice requires 2–6 distinct choices and a correct answer selected from those choices.
   - The teacher can save a draft or publish the challenge.
4. **Student view:** Sign in with a fictional student account, join a class with its code, and open a published challenge.
5. **Submit an answer:** Submit a multiple-choice answer to show immediate correct/try-again feedback. Submit a short answer to show that it has been sent for teacher review.
6. **Teacher progress:** Return to the teacher account and show the progress summaries and student-by-challenge table. A teacher can open a short answer, then mark it Correct or Needs revision.
7. **Evaluation result:** Multiple-choice feedback is saved with the submission. A short-answer result appears on the student's challenge card after the teacher records an evaluation.
8. **Class and profile management:** If time allows, show class rename/student removal/class deletion controls and profile display-name editing. Destructive actions ask for confirmation.

## How to describe the technology

- **React** builds the interactive screens and reusable UI.
- **Vite** runs the app locally and creates the production frontend build.
- **Supabase Auth** handles account creation and sign-in.
- **Supabase Postgres** stores profiles, classes, enrollments, challenges, answer keys, and submissions.
- **Row-level security (RLS)** limits which rows an authenticated teacher or student can access. The frontend does not decide access based just on which role button was selected.
- **Database functions (RPCs)** handle joining a class and submitting answers. The submit function checks multiple-choice responses against the protected answer key; row-level security limits teacher evaluations to short answers and prevents students from changing evaluation fields.
- **Vercel** is the intended hosting provider. The GitHub connection still needs to be completed before merges and pull requests can create production and preview deployments.

## Useful code locations

- `src/App.tsx` — session/profile loading, teacher and student dashboards, class actions, answer submission, and progress data.
- `src/components/AuthScreen.tsx` — teacher/student account creation and sign-in forms.
- `src/components/ChallengeForm.tsx` — challenge form, choice validation, publishing, and private answer-key storage.
- `src/lib/supabase.ts` — creates the Supabase client from environment variables.
- `src/lib/types.ts` — frontend types for profiles, classes, challenges, and submissions.
- `supabase/01_schema.sql` — database tables and profile-on-signup trigger.
- `supabase/02_security.sql` — row-level security policies and `join_class` / `submit_answer` functions.
- `supabase/03_seed.sql` — fictional sample accounts and classroom data.
- `supabase/04_teacher_evaluation.sql` — historical migration, superseded by the current scope migration.
- `supabase/05_scope_multiple_choice_feedback.sql` — migration to restore automatic multiple-choice feedback while retaining teacher review for short answers.

## What is implemented

- Teacher/student sign-up and sign-in, with role stored in the user profile.
- Teacher class creation, join-code display/copying, class renaming, student removal, and class deletion.
- Challenge creation, editing, deleting, draft/published state, and multiple-choice or short-answer types.
- Student class joining, published challenge list, All/To do/Done filters, answer submission, and saved-answer display.
- Immediate multiple-choice feedback without exposing the answer key to the browser.
- Teacher evaluation controls for short-answer submissions.
- Teacher progress summaries, per-student/per-challenge status, and a short-answer viewer.
- Figma-inspired signed-in workspace layout with role-based navigation, a class greeting banner, challenge cards, and student discovery summary.
- Profile display-name editing and sign-out.
- Responsive styling for phone-sized screens.

## Current limitations and caveats

- The optional public marketing home page and challenge library/subject filters are excluded; the flow document labels them Extra or Stretch.
- The project flow documents leave due dates, retry/completion rules, accuracy definitions, and some answer-retention decisions open. Don’t present these as settled product rules.
- Supabase environment variables must be configured for authentication and database features to work. Never use or share a service-role key in the frontend.
- Supabase may rate-limit signup confirmation emails. For seeded demo data, use the fictional demo accounts listed in the README after running the seed SQL.
- The frontend build and lint checks pass. That does not replace testing against the team’s live Supabase project on laptop, tablet, and phone.
- Vercel’s GitHub integration is not connected yet. Production deployment and PR preview links are therefore not active.

## Quick answers to likely questions

**Why Supabase instead of a separate backend?**  
The app can use Supabase Auth, Postgres, row-level security, and database functions directly. This meets the project’s needs without a separate backend server.

**When do students see whether an answer is correct?**  
Multiple-choice results appear after database evaluation. Short-answer results appear only after the teacher reviews the submission and records an evaluation.

**What happens to short answers?**  
They are saved without automatic grading or result feedback. A teacher can open and evaluate the submitted text from the class progress view.

**Can students see drafts or other classes?**  
The frontend requests published challenges for their class, and the database’s RLS policies enforce the access rules independently of the UI.

**Is it deployed?**  
Not yet. The local frontend is implemented, but the Vercel-to-GitHub project connection still needs to be completed.

## Before presenting

- Start the app from the project folder with `npm run dev`.
- Confirm `.env` contains the Supabase project URL and public anon key. Do not show the key while presenting or put it in slides.
- Confirm the database scripts have been run in order: `01_schema.sql`, `02_security.sql`, `03_seed.sql`, then `05_scope_multiple_choice_feedback.sql`. Do not run the historical `04_teacher_evaluation.sql`.
- Use only the fictional demo accounts and fictional data. Never enter real student or teacher records.
- Keep a backup screenshot or screen recording in case the live Supabase service is unavailable.
