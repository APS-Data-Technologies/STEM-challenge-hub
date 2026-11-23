# Progressive Hints Feature - Database Migration Guide

## Overview
The progressive hints feature has been fully implemented in the frontend and backend code, but requires a database migration to enable it.

## What's Implemented

### Frontend
- ✅ Hint input fields added to Challenge Form (3 levels: Hint 1, 2, 3)
- ✅ Progressive hint display logic in App.tsx (getProgressiveHint function)
- ✅ Wrong attempt tracking per session
- ✅ Fallback auto-generated hints when teacher-provided hints are not available
- ✅ CSS styling for hints section with beige background and left border

### Backend / Database Schema
- ⏳ Migration file created: `supabase/11_progressive_hints.sql`
- ⏳ Needs to be applied to Supabase project

## How to Apply the Migration

### Via Supabase Dashboard (Recommended for quick testing)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query** (or **+** button)
4. Copy the entire contents of `supabase/11_progressive_hints.sql`
5. Paste into the SQL editor
6. Click **Run** button
7. Confirm all statements executed successfully

### Via Supabase CLI (For production)
```bash
# If using Supabase CLI
supabase db push
```

## Migration Details

The `11_progressive_hints.sql` migration adds:

1. **Three new columns to the `challenges` table:**
   - `hint_level_1 text` - First hint (after 1st wrong answer)
   - `hint_level_2 text` - Second hint (after 2nd wrong answer)
   - `hint_level_3 text` - Third hint (after 3rd wrong answer)

2. **New `answer_attempts` table** (optional, for tracking)
   - Tracks student wrong attempts per challenge
   - Includes RLS policies for student/teacher access

3. **Column comments** explaining each hint level's purpose

## How the Feature Works

### Teacher Perspective
1. When creating a multiple-choice challenge, teachers see a **"Progressive Hints (Optional)"** section
2. Teachers can enter 3 levels of hints (each 200 character max):
   - Hint 1: General guidance to point direction
   - Hint 2: More specific guidance
   - Hint 3: Nearly gives away the answer
3. If hints are left blank, auto-generated hints will be used

### Student Perspective
1. Student answers a multiple-choice question incorrectly
2. After 1st wrong answer: Sees "Good try. Revisit the clues..." + Hint Level 1
3. After 2nd wrong answer: Sees the message again + Hint Level 2
4. After 3rd wrong answer: Sees the message again + Hint Level 3
5. Hints use teacher-provided content if available, otherwise show auto-generated hints

## Testing the Feature

After applying the migration:

1. Build the app: `npm run build`
2. Start preview: `npm run preview`
3. As a teacher, create a multiple-choice challenge
4. Fill in all 3 hint fields with custom text
5. Publish the challenge
6. As a student, attempt to answer it wrong 3 times
7. Verify hints appear after each wrong attempt

## Code Files Modified

- `src/components/ChallengeForm.tsx` - Added hint input fields to form
- `src/lib/types.ts` - Added optional hint fields to Challenge interface
- `src/App.tsx` - Added progressive hint display logic and attempt tracking
- `src/App.css` - Added styling for hints section
- `supabase/11_progressive_hints.sql` - Database migration (needs to be applied)

## Fallback Behavior

If the database columns don't exist yet, the app will:
- Still show the hint input fields to teachers
- Teachers' hints will not be saved (error message will appear)
- Auto-generated hints will work for students (fallback)

Once the migration is applied, teachers' custom hints will be persisted and shown to students.

## References
- Database schema: `supabase/01_schema.sql`
- Security policies: `supabase/02_security.sql`
- Original implementation task: Progressive hints for wrong answers
