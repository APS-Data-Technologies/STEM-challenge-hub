-- =====================================================================
-- 13_enable_feedback_default.sql
-- Enable feedback on all published challenges by default
-- This allows students to submit feedback on existing challenges
-- Run after migration 12
-- =====================================================================

-- Enable feedback on all published challenges
UPDATE public.challenges
SET feedback_enabled = true
WHERE is_published = true AND feedback_enabled = false;
