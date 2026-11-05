# STEM Challenge Hub User Flow

_Simple user flows and essential requirements_

Prepared by: Kinjal Bhatt | October 29, 2026 · Updated November 4, 2026 to match the current Figma design

Teachers post short K–12 STEM challenges. Students join a class, open a challenge, answer it, and get feedback. Teachers view class progress and read short answers.

## 1. Teacher flow

Start with a teacher account. Teachers land on **My classes**. Create a class and share its join code, then create a challenge for that class and save it as a draft or publish it.

![Teacher flow](images/flow-teacher.png)

Class management: on **Class details**, teachers can rename a class, remove a student, and delete a class. From Class details or Class progress they can edit or delete a challenge. Every removal or deletion asks for confirmation first.

Optional: teachers can browse the **Challenge library** (48 real classroom activities, filtered by subject and grade band) and click **Copy to my class**. The copy appears in the class’s Challenges tab as **NEW · DRAFT**, so the teacher can edit it before publishing.

Create challenge now has step 4, Levels & help: how many steps Medium (default 3) and Hard (default 1) show, an optional extra hint, safety tip and note for students, an optional due date, and “Use as a Daily challenge” with its date (one per class per day). Teachers open written answers from Class progress and can leave a short comment. Class progress shows each student’s level (for example “Correct · Easy → Hard”). Step 4 also has an optional Hard-level question with its own choices. Written answers are not graded.

## 2. Student flow

A student needs an account and a teacher’s class code. New students go to **Join class** after signing up. Students already in a class land directly on **My challenges**.

![Student flow](images/flow-student.png)

My challenges starts with the Daily challenge card: one multiple-choice question, about a minute, with a streak. Below it, each challenge shows a status (To do or Done). Students can filter by subject and switch between the To do and Done tabs in every grade band.

Challenge details (opened with Start) shows a summary, an introduction, materials, step-by-step instructions, a safety tip and an optional short video link. Before starting, the student picks a level: Easy (full instructions and hints), Medium (first 3 steps) or Hard (first step only). Levels follow the grade band, and hints never change the score. Once the student starts answering, the level is locked for that try; to go harder they start a new try. If the teacher added a Hard-level question, Hard shows that question instead.

Multiple choice gives instant feedback matched to the grade. K–2 and 3–5 see “Great job! ⭐” or “Almost! Try a hint 💡”. 6–8 and 9–12 see “✓ Correct” or “💡 Not quite. Check the hint and try again.” The wording follows the challenge’s grade band, not the student’s age. Feedback always uses text plus an icon, never red. Written answers are not graded, and the teacher may leave a short comment. After answering, students can rate the challenge or skip.

My Journey (from the Profile menu) lists finished challenges, newest first, with the date, level and result. Repeat tries at a harder level are grouped together, and written answers show the teacher’s comment. Daily challenges are grouped by week (for example “This week · 2 of 3 correct · 🔥 4-day streak”), and tapping a week shows each day. Wrong answers show “↻ Not yet” in grey, never red. The streak counts days in a row the student answered, right or not.

Wrong code: show “Code not found. Check the code with your teacher and try again.” and let the student retry. Already joined: show “You’re already in this class.” without creating another membership.

## 3. Sign-in, access and error states

- **Two roles:** teachers land on My classes; students land on My challenges.

- **Wrong password:** show “Email or password is incorrect. Please try again.” and keep the user on the sign-in page.

- **Forgot password:** enter email → “Check your email” (same message whether or not the account exists; the link works for 1 hour) → set a new password → sign in with a “Password updated” message.

- **Teacher pages:** a student who opens a teacher page sees “Teachers only – You don’t have access to this page.”

- **Other class’s challenge:** a student who opens a challenge from another class sees “Challenge not available.”

- **Empty, loading and error states:** a new teacher sees “No classes yet”, a class without students shows “No students yet”, a student with no challenges sees “No challenges yet”, lists show a short loading state, forms show required-field errors, and a failed submit shows “Your answer wasn’t sent” with Try again. Details are in Developer_Handoff.md, section 5.

## 4. Essential requirements

Use this checklist for the team handoff. These describe expected application behavior; a Figma prototype only demonstrates the experience.

- Accounts: sign up, sign in, choose Teacher or Student, forgot password, and sign out.

- Classes: teacher creates a class and shares its six-character join code; student joins once.

- Challenge form: title, prompt, subject (Science, Technology, Engineering, Math), grade band (K-2, 3-5, 6-8, 9-12) and answer type are required. Activity details, Levels & help, the due date and the Daily challenge option are optional. Field list: Challenge_Fields_for_Database.md.

- Multiple choice: 2–6 options with one correct answer marked (shuffle the choices in the app). Written answer: text response, not graded. Daily challenge: one multiple-choice question.

- Visibility: drafts stay hidden from students; published challenges appear only in the intended class.

- Answers: grade-matched instant feedback for multiple choice (text plus icon, no red). Written answers are saved ungraded with an optional teacher comment. Student results are kept separate from usability-test results.

- Progress: a table with one row per student and one column per challenge (Not started, Completed, Correct or Incorrect); teachers can open submitted short answers.

- Access and safety: students cannot open teacher-only or other-class content; confirm destructive actions.

- Usability: keep forms, errors, navigation and controls readable on laptop, tablet and phone (Chrome and Safari), with WCAG AA color contrast.

### Decisions needed before development

- How many retries are allowed, and when does a challenge count as Done?

- How is the progress percentage calculated?

- How is an existing draft published? (Decided: the due date is an optional field.)

- What happens to answers after removal, deletion, or editing a published challenge?

- Video links: decided. They are optional, short, age-appropriate links that teachers check play on school networks.

- Ratings: are student ratings stored, and who can see them?

- Quizzes and full tests: planned for after Nov 20 (needs database changes). Only the Daily challenge is in scope now.

### Optional features (beyond the must-haves)

These are designed in Figma but are not core requirements. Confirm each with the PM before building; they are also listed in the “Scope notes” box at the top of the Color Mockups page.

- Public Home page and Explore challenges page (browse by subject and grade without signing in)

- Challenge library with combined subject + grade band filters and “Copy to my class”

- Challenge details page with summary, materials, steps and how-to video

- Feedback screen with star rating and “Would you do it again?”

- Status pills and COMPLETED / IN REVIEW badges on challenge cards

- Demo student picker on sign-in (Mia K–2, Leo 3–5, Alex 6–8, Sam 9–12): prototype only, do not build.

Removed from the design: remembering the subject picked on the Home page after sign-in. Students always land on My challenges and can filter there.

### Prototype flows to test

| **Flow in Figma (Play)**                              | **What it covers**                                                                           |
|-------------------------------------------------------|----------------------------------------------------------------------------------------------|
| Laptop / Tablet / Phone prototype (Teacher + Student) | Full teacher and student journeys, starting at Home                                          |
| Edge case: student opens a teacher page               | “Teachers only” screen                                                                       |
| Edge case: challenge from another class               | “Challenge not available” screen                                                             |
| Edge case: required fields missing                    | Create challenge with error messages                                                         |
| Edge case: no challenges yet                          | Empty My challenges for a student                                                            |
| Edge case: answer not sent (network error)            | Error banner with Try again                                                                  |
| Student: Daily challenge, levels, My Journey          | Sign in as a demo student (any grade) → Daily challenge → pick a level → answer → My Journey |
| Teacher: create challenge with Levels & help          | Step 4 fields, due date, Daily challenge date, comment on a written answer                   |
| Wireframe – Laptop / Wireframe – Phone                | Clickable low-detail wireframes                                                              |

### Design references

[Research and design rationale](https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=213-2)

[Wireframes and screen structure](https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=7-2)

[Color Mockups and clickable prototype](https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=27-2)

[Style Guide (colors and WCAG contrast)](https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=7-3)

Developer files: tokens.css (design tokens, matching the Figma “Design tokens” variables), Developer_Handoff (see section 4b, Prototype shortcuts), Challenge_Fields_for_Database, and the real challenge source list (48 activities with source links and full-page checks).

Research uses secondary reviews and fictional personas. Usability test results are not yet recorded. This summary explains the intended journeys; it does not confirm a working application.
