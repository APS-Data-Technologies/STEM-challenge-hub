# STEM Challenge Hub – Wireframe Document

Prepared by: Kinjal Bhatt · Updated November 4, 2026

Figma file: **STEM Challenge Hub** → page **Wireframe**. The wireframes are grey, low-detail versions of the Color Mockups. They show layout and click paths, not final colors.

## How to use it

- Press **Play** on the Wireframe page and choose a flow:
  - **Wireframe – Laptop** or **Wireframe – Phone** for the full teacher and student journey.
  - The edge-case flows: No access, Challenge not available, No challenges yet.
- 69 screens: laptop and phone for every main screen, plus tablet for "Challenge not available".
- 527 click links, all checked on Nov 4, 2026, with none broken.

## Screens

| # | Screen | Who | What it shows |
|---|---|---|---|
| 0 | Home | Visitor | Intro, subject and grade picks, Sign in |
| 0b | Explore challenges | Visitor | All 48 challenges, filtered by subject and grade |
| 1 / 1b / 1c | Sign in · Sign up · Forgot password | Everyone | Teacher or Student role, plus the wrong-password state |
| 2 | My classes | Teacher | Classes and join codes, plus the "new class added" state |
| 3 / 3b | Create challenge · Edit challenge | Teacher | Steps 1–4: the challenge, activity details, subject and grade, answers, then **Levels & help** (steps shown on Medium/Hard, extra hint, safety tip, note, due date, Daily challenge option) |
| 4 | Join class | Student | Enter the 6-character class code |
| 5 | My challenges | Student | **Daily challenge** card, **My Journey** link, To do / Done tabs, subject filter, challenge cards |
| 5d | Daily challenge | Student | One multiple-choice question, instant feedback, streak |
| 6a | Challenge details | Student | Summary, introduction, materials, **Choose your level** (Easy / Medium / Hard) right above the Instructions, optional video, safety tip |
| 6 / 6b | Answer · Short answer | Student | Multiple choice with instant feedback, or a written answer (not graded) |
| 6f | Feedback | Student | Rate the challenge, "Would you do it again?" |
| 7 / 7b | Class progress · Short-answer pop-up | Teacher | Results per student; open written answers |
| 8 / 8b | No access · Challenge not available | Student | Error states |
| 9 | Challenge library | Teacher | Browse the real challenges, Copy to my class |
| 9b | My Journey | Student | Finished challenges with date, level and result; repeat tries grouped; teacher comment on written answers; Daily challenges grouped by week ("Not yet" in grey) |
| 10 | Class details | Teacher | Students tab and Challenges tab |
| Pop-ups | Create class, Class created, Edit class name, Delete class, Remove student, Profile (Teacher/Student), Copied to class | — | Confirmations and menus |

## What changed on Nov 4, 2026

- **New screens:** 5d Daily challenge and 9b My Journey, for laptop and phone.
- **My challenges:** added the Daily challenge card and a My Journey link.
- **Challenge details:** added the level box above the Instructions. Easy shows a hint and all steps, Medium the first 3 steps, and Hard step 1. "Watch first" is renamed "Optional video".
- **Create / Edit challenge:** added step 4, Levels & help.
- **Clean-up:** removed leftover "EXTRA" and "STRETCH" labels, filled empty answer-choice labels, and fixed overlapping screens.

## What the wireframes don't show

These are only in Color Mockups:
- the demo-student picker (prototype only)
- the level lock box
- the Hard-level question fields
- the teacher comment box
- grade-matched feedback wording
- the level shown in Class progress

The developer should follow Color Mockups and the Developer Handoff.
