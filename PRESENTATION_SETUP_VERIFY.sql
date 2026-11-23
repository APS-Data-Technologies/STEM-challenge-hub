-- STEM Challenge Hub - Presentation Setup Verification
-- Run this in Supabase SQL Editor to verify everything is ready

-- ✅ 1. Check if challenge_feedback table exists and has RLS enabled
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✓ RLS ENABLED' ELSE '✗ RLS DISABLED' END as "RLS Status"
FROM pg_tables 
WHERE tablename = 'challenge_feedback' AND schemaname = 'public';

-- ✅ 2. Count test data inserted
SELECT COUNT(*) as "Total Feedback Records" FROM public.challenge_feedback;

-- ✅ 3. Verify RLS policies exist
SELECT 
  policyname,
  qual as "Policy Expression",
  CASE 
    WHEN cmd = '*'::text THEN 'ALL'
    WHEN cmd = 'r'::text THEN 'SELECT'
    WHEN cmd = 'a'::text THEN 'INSERT'
    WHEN cmd = 'w'::text THEN 'UPDATE'
    WHEN cmd = 'd'::text THEN 'DELETE'
    ELSE cmd
  END as "Command Type"
FROM pg_policies 
WHERE tablename = 'challenge_feedback' AND schemaname = 'public'
ORDER BY policyname;

-- ✅ 4. Sample the test data - Difficulty ratings
SELECT 
  difficulty,
  COUNT(*) as "Count",
  ROUND(100 * COUNT(*)::numeric / (SELECT COUNT(*) FROM public.challenge_feedback), 1) as "Percentage"
FROM public.challenge_feedback
GROUP BY difficulty
ORDER BY 
  CASE difficulty 
    WHEN 'easy' THEN 1 
    WHEN 'medium' THEN 2 
    WHEN 'hard' THEN 3 
  END;

-- ✅ 5. Sample the test data - Enjoyment ratings
SELECT 
  enjoyment,
  COUNT(*) as "Count",
  ROUND(100 * COUNT(*)::numeric / (SELECT COUNT(*) FROM public.challenge_feedback), 1) as "Percentage"
FROM public.challenge_feedback
GROUP BY enjoyment
ORDER BY 
  CASE enjoyment 
    WHEN 'loved' THEN 1 
    WHEN 'liked' THEN 2 
    WHEN 'okay' THEN 3 
    WHEN 'struggled' THEN 4 
  END;

-- ✅ 6. Sample the test data - Clarity ratings
SELECT 
  clarity,
  COUNT(*) as "Count",
  ROUND(100 * COUNT(*)::numeric / (SELECT COUNT(*) FROM public.challenge_feedback), 1) as "Percentage"
FROM public.challenge_feedback
GROUP BY clarity
ORDER BY 
  CASE clarity 
    WHEN 'clear' THEN 1 
    WHEN 'somewhat' THEN 2 
    WHEN 'confusing' THEN 3 
  END;

-- ✅ 7. Show recent feedback comments
SELECT 
  submitted_at,
  difficulty,
  enjoyment,
  comment
FROM public.challenge_feedback
WHERE comment IS NOT NULL
ORDER BY submitted_at DESC
LIMIT 5;

-- ✅ 8. Verify table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'challenge_feedback' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 📋 INTERPRETATION GUIDE
-- If all queries above return results (not empty), you're ready!
-- 
-- Query 1: Should show "✓ RLS ENABLED" 
--   → If NOT, run: ALTER TABLE public.challenge_feedback ENABLE ROW LEVEL SECURITY;
--
-- Query 2: Should show 13 (or close to it)
--   → If 0, run fictional_test_data.sql in the SQL editor
--
-- Query 3: Should show 3 policies:
--   - feedback: students submit for own classes
--   - feedback: students update own
--   - feedback: teachers read own classes
--
-- Queries 4-6: Show distribution of ratings for presentation talking points
--
-- Query 7: Shows student comments for demo
--
-- Query 8: Shows table structure matches expectations
