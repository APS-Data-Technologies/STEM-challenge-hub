# STEM Challenge Hub – Developer Handoff

Design handoff for the React + Vite app (Supabase backend, Vercel hosting).
The **user journeys** are explained in Flow Document 03 (see below). This file only covers what you need to build them: scope, layouts, interactions, states, styling and open questions.

> **Status:** design ready for build of the must-haves. Optional features are waiting for PM approval.
> **Last updated:** November 3, 2026

---

## 1. Design references

| What | Where |
|---|---|
| Figma file (all pages) | https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub |
| **Color Mockups** – final screens (source of truth) | https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=27-2 |
| Clickable prototype (laptop) | https://www.figma.com/proto/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=169-3837&starting-point-node-id=169%3A3837 |
| Prototype flows (Figma → ▶ Play) | `Laptop prototype (Teacher + Student)`, `Tablet prototype (Teacher + Student)`, `Phone prototype (Teacher + Student)`, plus two edge-case flows per size: `Edge case: student opens a teacher page`, `Edge case: challenge from another class` |
| Style Guide (colors + WCAG contrast) | https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=7-3 |
| Wireframes (early, low detail) | https://www.figma.com/design/Zd8MtyHyHS572maRVCAl9u/STEM-Challenge-Hub?node-id=7-2 |
| **Flow Document 03** | `STEM-Challenge-Hub-Flow-Document_03_1103.docx` (in this folder, `docs/design/`) |
| Design tokens | `tokens.css` (in this folder) – also in Figma as the **Design tokens** variable collection |
| Real challenge list (48 activities + sources) | `real-challenge-sources.md` (in this folder) |

**Tips for Figma Dev Mode:** select any element to see its size, spacing and the token name (for example `var(--color-primary)`). Screen names start with a number that matches the flow: `1.` sign in, `2.` My classes, `3.` Create challenge, `4.` Join class, `5.` My challenges, `6.` Answer, `7.` Class progress, `8.` access errors, `9.` Library, `10.` Class details. `Overlay: …` frames are pop-ups (dialogs).

If the prototype link asks for access, ask the designer to set the Figma file to **Anyone with the link can view**.

---

## 2. Implementation scope

Journeys and rules are in **Flow Document 03 → sections 1, 2 and 4**. Build in this order.

### 2.1 Required (README must-haves)

| Screen (Figma name) | Role | Notes |
|---|---|---|
| `1. Sign in`, `1b. Sign up` (+ wrong-password states) | Both | Role toggle Teacher / Student. Teachers land on My classes; students land on My challenges; new students go to Join class. |
| `2. My classes` | Teacher | Class cards with join code, student count, challenge count. |
| `Overlay: Create class` → `Overlay: Class created` | Teacher | Shows the new 6-character join code with **Copy code**. |
| `10. Class details – Students / Challenges` | Teacher | Rename class, remove student, delete class, list of challenges (PUBLISHED / DRAFT). |
| `3. Create challenge`, `3b. Edit challenge` | Teacher | Title, prompt, subject, grade band, answer type, 2–6 choices with one correct. Save draft / Publish / Save changes / Delete. |
| `4. Join class` | Student | Enter code → that class's challenges. |
| `5. Challenge list` ("My challenges") | Student | Cards with subject, grade, answer type, due date, status, Start / View my answer. |
| `6. Answer + feedback`, `6w.` (wrong choice), `6b. Short answer` | Student | Correct! / Try again for multiple choice; Answer saved for short answer. |
| `7. Class progress` + `Overlay: Short answer – <student>` | Teacher | Table: one row per student, one column per challenge; open short answers. |
| `8. No access`, `8b. Challenge not available` | Student | Access-rule error pages. |

### 2.2 Optional – waiting for PM approval (do not build until approved)

These are listed in the **Scope notes** box at the top of the Color Mockups page and in **Flow Document 03 → Optional features**.

| Feature | Figma screens |
|---|---|
| Public Home + Explore challenges | `0. Home – EXTRA`, `0b. Explore challenges – EXTRA` |
| Challenge library + subject/grade filters + Copy to my class | `9. Challenge library`, `Overlay: Copied to class`, `10. Class details – Challenges – copied from library` |
| Challenge details page with video | `6a. Challenge details`, `Overlay: Challenge video`; extra form step "Activity details" in `3.` / `3b.` |
| Feedback + star rating | `6f. Feedback`, `Overlay: Thanks for feedback` |
| Forgot password | `1c.` → `1d.` → `1e.` → `1f.` (uses Supabase `resetPasswordForEmail` / `updateUser`) |
| Status pills + COMPLETED / IN REVIEW badges | On `5.` challenge cards |

Not in the design any more: remembering the subject picked on Home after sign-in.

---

## 3. Responsive layouts

Each screen exists in three Figma frames. Follow the frame whose width is closest to the device.

| Frame | Figma size | Use for screen widths | Page side padding | Card grid |
|---|---|---|---|---|
| Phone | 390 × 844 | < 768 px | 20 px | 1 column |
| Tablet | 768 × 1024 | 768 – 1199 px | 48 px | 2 columns |
| Laptop | 1440 × 1024 | ≥ 1200 px | 48 px, content max 1344 px, centered | 3 columns |

How layouts adapt (build mobile-first, then add breakpoints at **768 px** and **1200 px**; the `.page` class in `tokens.css` already does the padding):

- **Card grids** (My challenges, Library, Explore): 1 → 2 → 3 columns, 24 px gap. Cards keep the same content order at every size.
- **Rows that sit side by side on laptop stack vertically on phone**: class cards on My classes, challenge rows in Class details, the Class details header buttons (Edit name / Delete class), and the steps of Create challenge.
- **Challenge details:** laptop = main column + right sidebar (video, safety tip, teacher note). Tablet and phone = one column, with the video card placed after the Summary.
- **Progress table:** full table (row per student, column per challenge) on laptop and tablet; on phone each student row becomes a stacked card that lists the status for each challenge.
- **Sign in / Sign up:** laptop shows the welcome illustration panel beside the form; tablet and phone show the panel above the form.
- **Dialogs (pop-ups):** 480 px wide on tablet and laptop, 350 px on phone, centered on a 40 % black backdrop (`--color-backdrop`).
- **Top bar:** 72 px high at every size; on phone it shows only the logo (role label and Sign out link are hidden).
- **Touch targets:** buttons, inputs and filter chips are at least 48 px high (chips 40 px) at every size.

---

## 4. Interactions

The click paths are in **Flow Document 03** and in the Figma prototype. This section lists the rules behind them.

**Buttons**
- **Primary (blue)** = the main action on a screen (Sign in, Publish to class, Join class, Submit answer, Start). One per area.
- **Secondary (white with border)** = other actions (Save draft, Cancel, View my answer, Done).
- **Destructive** actions (Delete challenge, Delete class, Remove student) always open a confirmation dialog first; the confirm button names the action ("Yes, delete").
- Disable a submit button while its request is running (see section 5) to prevent double submits.

**Links**
- Back links at the top left (`← My classes`, `← My challenges`) return to the parent screen.
- The logo goes to the user's home screen (My classes for teachers, My challenges for students; Home when signed out).
- Source links on library cards open the external activity page in a **new tab**.

**Selections**
- **Role toggle** (Teacher / Student) on Sign in and Sign up: one selected at a time.
- **Subject, grade band, answer type** on Create challenge: single-select pickers (one active at a time).
- **Answer choices** (student): single-select radio list; Submit stays disabled until one is chosen.
- **Mark correct** (teacher form): exactly one correct choice.
- **Filters:** My challenges = subject chips + To do / Done tabs. Library / Explore = subject row AND grade-band row; both filters apply together, and **All** clears only its own row.
- **Rating** (optional feature): one of Excellent / Very good / Good / OK / Poor; "Do it again?" Yes / Maybe / No.

**Dialogs**
- Open on top of the current screen with the dimmed backdrop. Close with Cancel / Done, the backdrop, or **Esc**.
- Move keyboard focus into the dialog when it opens and back to the trigger button when it closes.
- Used for: Create class, Class created (Copy code), Edit class name, Delete class, Remove student, Delete challenge, Correct!, Try again, Answer saved, short-answer review, Copied to class, video, Thanks for feedback, Profile.

**Accessibility** (applies to all of the above): every control works with the keyboard, shows the focus ring from `tokens.css`, and has a text label. Status is never shown by color alone (pills and badges also have text and an icon).

---

## 5. Screen states

Messages already in Figma are marked ✅. Items marked 🟡 are **not drawn in Figma yet**; use the proposed rule and wording below, and the designer will add frames if the PM wants them.

| State | Where | What to show |
|---|---|---|
| Required-field error 🟡 | All forms | Red border (`--color-error-fg`) on the field + message under it, e.g. "Enter a title." / "Choose a subject." / "Add at least 2 answer choices." / "Mark one choice as correct." Show on submit, then clear as the user fixes it. Move focus to the first error. |
| Wrong password ✅ | Sign in | Banner: "Email or password is incorrect. Please try again." |
| Wrong join code ✅ | Join class | "Code not found. Check the code with your teacher and try again." |
| Already joined ✅ | Join class | "You're already in this class." (no duplicate membership) |
| No access ✅ | Teacher pages opened by a student | `8. No access` – "You don't have access to this page." |
| Challenge not available ✅ | Challenge from another class | `8b. Challenge not available` |
| Loading 🟡 | Any page or list fetching data | Skeleton cards / rows in the same layout as the loaded state; buttons show a spinner and the label "Saving…", "Signing in…", "Joining…". |
| Empty – class with no challenges ✅ | My classes card | "0 students · No challenges yet" |
| Empty – lists 🟡 | My classes, My challenges, Class details, Progress | Short message + one action, e.g. "No classes yet – Create your first class", "No challenges yet – your teacher hasn't posted any", "No students yet – share code K7P2QX". |
| Success ✅ | Various | "Class created!" + code, "Code copied ✓", "Answer saved", "Correct!", "Copied to Grade 6 · Room 204", "Password updated. Sign in with your new password." |
| Draft notice ✅ | Copied / draft challenge | "It's saved as a draft, so you can edit it before publishing to students." |
| Network / server failure 🟡 | Any save or load | Error banner (`--color-error-bg` / `--color-error-fg`): "Something went wrong. Please try again." with a **Try again** button. Keep what the user typed. |

---

## 6. Styling

All values are in **`tokens.css`** (this folder) and match the Figma **Design tokens** variables exactly.

**Setup**
1. Copy `tokens.css` to `src/styles/tokens.css`.
2. In `src/main.jsx`: `import './styles/tokens.css';`
3. Load the Inter font in `index.html` (the link is in the comment at the top of `tokens.css`).
4. Use variables, never hard-coded values: `color: var(--color-text);`, `padding: var(--space-4);`, `border-radius: var(--radius-lg);`.

**Fonts** – Inter, weights 400 / 500 / 600 / 700 / 800. Sizes from 12 px (tags) to 38 px (Home hero); body text is 16 px. Use the ready-made styles such as `font: var(--text-h1);`, `var(--text-body)`, `var(--text-button)`.

**Colors** – Primary blue `--color-primary` (#1D4ED8), navy text `--color-text`, muted text `--color-text-muted`, page `--color-bg-page`, cards `--color-bg-surface`, borders `--color-border`. Feedback, subject and status colors have their own tokens (`--color-success-*`, `--color-science-*`, `--color-status-*`, …). All text/background pairs in the Style Guide pass WCAG AA (4.5:1).

**Spacing and shape** – 4 px scale (`--space-1` = 4 px … `--space-12` = 48 px), corner radius tokens (`--radius-lg` 12 px for buttons and inputs, `--radius-xl` 16 px for cards, `--radius-pill` for pills), shadows (`--shadow-card`, `--shadow-dialog`).

**Component tokens** – Button, Input, Card, Chip, Tag/Pill, Dialog and Top bar have their own tokens (e.g. `--button-primary-bg`, `--card-radius`, `--dialog-padding`) so React components map 1-to-1 to Figma components.

**Illustrations and icons** – original artwork in Figma (pages *Components* and *STEM Illustration Assets*). Export as SVG from Figma (select → Export → SVG).

If a token value changes, update **both** the Figma variable and `tokens.css`.

---

## 7. Open questions (need PM / team agreement)

Also listed in **Flow Document 03 → Decisions needed before development**.

1. **Retries:** how many "Try again" attempts on multiple choice, and when does a challenge count as Done?
2. **Progress %:** how is "70 % correct on multiple choice" calculated (first attempt or best attempt)?
3. **Due dates and publishing:** how is a due date set, and how does a teacher publish an existing draft?
4. **Deleting submitted work:** what happens to student answers when a challenge is edited or deleted after students have answered, or when a student is removed from a class?
5. **Video links:** are YouTube links allowed if some schools block YouTube? Use privacy-enhanced embeds (`youtube-nocookie.com`) if yes.
6. **Ratings:** are student ratings stored, and who can see them?
7. **Optional features:** which of the features in section 2.2 are approved for this term?
8. **Sign out on phone:** the Sign out link is hidden in the phone frames. Designer to confirm where it goes (for example inside the Profile pop-up).
9. **Missing states:** should the designer draw the 🟡 states in section 5 (required-field errors, loading, empty lists, network failure), or is the proposed wording enough?
