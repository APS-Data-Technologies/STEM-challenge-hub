-- QUICK FIX: Add hint columns to challenges table for progressive hints feature
-- This is the minimal migration needed to enable hints

-- Step 1: Add the three hint columns
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT NULL;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS hint_level_3 TEXT DEFAULT NULL;

-- Step 2: Add feedback_enabled column (for feedback system)
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT TRUE;

-- Done! Hints are now enabled in the database.
-- Teachers can now provide hints when creating challenges.
-- Students will see hints after wrong answers.
