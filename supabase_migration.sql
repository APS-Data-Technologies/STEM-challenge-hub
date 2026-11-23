-- Migration: Add hint columns to challenges table
-- Purpose: Support progressive hints for student feedback system
-- Date: 2026-11-23

-- Add hint_level_1 column if it doesn't exist
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT NULL;

-- Add hint_level_2 column if it doesn't exist
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT NULL;

-- Add hint_level_3 column if it doesn't exist
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS hint_level_3 TEXT DEFAULT NULL;

-- Add feedback_enabled column if it doesn't exist (for feedback toggle)
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS feedback_enabled BOOLEAN DEFAULT TRUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenges_feedback_enabled 
ON challenges(id, feedback_enabled);

-- Success message
-- Migration complete! All columns added successfully.
