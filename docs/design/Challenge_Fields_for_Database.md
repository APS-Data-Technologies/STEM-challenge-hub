# What a teacher fills in when creating a challenge

STEM Challenge Hub · for the Supabase `challenges` table · checked against Figma on Nov 5, 2026
Figma source: Color Mockups → **3. Create challenge (Teacher)**. The 3b Edit and 3c Errors screens use the same fields.

Scope for now: regular challenges plus the **Daily challenge**. Quizzes and full tests are planned for after Nov 20.

## Fields on the form

| # | Form label | Suggested column | Type | Required | Notes |
|---|---|---|---|---|---|
| 1 | Title | `title` | text | Yes | e.g., "Building with Pasta" |
| 1 | Challenge prompt | `prompt` | text | Yes | The main question students answer (shown on Easy and Medium, and on Hard when there’s no Hard-level question) |
| 1b | Introduction | `introduction` | text | No | 2–3 sentences on why it matters |
| 1b | Materials (one per line) | `materials` | text[] | No | One item per line |
| 1b | Step-by-step instructions (one per line) | `steps` | text[] (ordered) | No | Easy shows all steps |
| 1b | Active time | `active_time` | text | No | e.g., "20–30 minutes" |
| 1b | Video link (optional) | `video_url` | text (URL) | No | Short, age-appropriate, plays on school networks |
| 2 | Subject | `subject` | enum | Yes | `science`, `technology`, `engineering`, `math` |
| 2 | Grade band | `grade_band` | enum | Yes | `K-2`, `3-5`, `6-8`, `9-12`. Levels follow this grade band. |
| 3 | Answer type | `answer_type` | enum | Yes | `multiple_choice` or `written` (the form says "Short answer") |
| 3 | Answer choices (2–6) | `choices` | text[] (2–6) | Only for multiple choice | Could also be a separate `challenge_choices` table |
| 3 | Mark correct | `correct_choice_index` | int | Only for multiple choice | Exactly one correct choice |
| 4 | Medium · steps shown | `medium_steps_shown` | int | No | Default **3** |
| 4 | Hard · steps shown | `hard_steps_shown` | int | No | Default **1** (a starter hint) |
| 4 | Extra hint (optional) | `extra_hint` | text | No | Shown on **Easy only**, in the 💡 Hint box above the steps |
| 4 | Safety tip (optional) | `safety_tip` | text | No | Shown at every level (sidebar on laptop, in the page on tablet and phone) |
| 4 | Note for students (optional) | `student_note` | text | No | Shown at every level (sidebar on laptop, in the page on tablet and phone) |
| 4 | Hard-level question (optional) | `hard_question` | text | No | A different “what if” question for Hard. If empty, Hard uses the main question. |
| 4 | Hard-level answer choices | `hard_choices` + `hard_correct_choice_index` | text[] (2–6) + int | Only if `hard_question` is set | Same rules as the main choices |
| 4 | Due date (optional) | `due_date` | date, can be empty | No | If empty, the student page doesn't show "Due". Not used for Daily challenges. |
| 4 | Use as a Daily challenge | `is_daily` | boolean | No | Default `false` |
| 4 | Daily challenge date | `daily_date` | date | Only if `is_daily` | Field appears only when the box is checked. Unique per class per day: `unique(class_id, daily_date)`. |

## Filled in automatically (the teacher doesn't type these)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `class_id` | uuid → classes | The class it's created in, e.g., "Grade 6 · Room 204" |
| `created_by` | uuid → teacher | The signed-in teacher |
| `status` | enum | `draft` (Save draft) or `published` (Publish to class) |
| `created_at`, `updated_at` | timestamp | |

## Rules for checking the form

- Title, prompt, subject, grade band and answer type are required. The 3c screen shows these errors.
- Multiple choice needs 2–6 choices and exactly one marked correct.
- If `hard_question` is filled in, `hard_choices` needs 2–6 choices and exactly one marked correct. If it’s empty, leave `hard_choices` empty.
- A Daily challenge must be **multiple choice with one question** and must have a `daily_date`.
- `medium_steps_shown` and `hard_steps_shown` must be between 0 and the number of steps, with Hard less than or equal to Medium.
- Easy, Medium and Hard are not stored per challenge. The student picks the level, and the app shows steps based on the numbers above.

## Saved when a student answers (for My Journey and Class progress)

This isn't part of the teacher's form, but the screens need it. Suggested `attempts` table:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `student_id`, `challenge_id` | uuid | Daily challenges are rows in `challenges` too, so they use the same table |
| `level` | enum | `easy`, `medium`, `hard`. Locked once the try starts. Repeat tries are separate rows, and My Journey groups them by challenge. |
| `started_at` | timestamp | Set when the student clicks “Answer the question”. This is when the level locks. |
| `choice_index` / `answer_text` | int / text | Multiple choice or written |
| `is_correct` | boolean, nullable | Multiple choice only. `null` for written answers, which **are not graded**. |
| `teacher_comment` | text, nullable | Short comment on written answers. Shown in My Journey. |
| `completed_at` | timestamp, nullable | Set when the answer is submitted. Ordering and the Daily streak come from this. |

- The Daily streak and the weekly "x of y correct" in My Journey are worked out from `attempts` (`is_correct`, `completed_at`). Don't store them.
- The level is locked when the student starts answering. Create the `attempts` row with its `level` at that moment. A harder level means a new attempt row.
- Class progress shows the level for each attempt; repeat tries appear as “Easy → Hard”.
- Hints never change the score, so there's nothing to store for hints.
- Prototype note: in Figma the 💡 Hint box shows each challenge’s student tip as sample text. In the app it should show `extra_hint`, and stay hidden if that’s empty.
- The feedback wording by grade band (K–2 and 3–5: "Great job! ⭐" / "Almost! Try a hint 💡" · 6–8 and 9–12: "✓ Correct" / "💡 Not quite. Check the hint and try again.") is front-end text, not database data. It's on the Style Guide page.
- Student results are separate from our usability-test results. The usability results live only on the Figma Research page.

## Decisions

- Due date: added as an optional field (Nov 4).
- Daily challenge date: added. It's required when "Use as a Daily challenge" is checked, and there's one per class per day.
- Extra hint: shown on Easy only (Nov 5). The form placeholder in Figma now says so.
- Level lock and Hard-level question: added Nov 4 (see `started_at`, `hard_question`).
