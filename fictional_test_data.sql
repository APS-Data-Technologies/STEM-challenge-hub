-- Fictional Test Data for STEM Challenge Hub Presentation
-- This data includes realistic challenge feedback, student responses, and analytics

-- First, let's get some existing IDs (adjust these based on your actual data)
-- You may need to modify the student_id and challenge_id values to match your actual records

-- Insert fictional feedback data for demonstration
-- Note: Replace the UUID values with actual IDs from your database

INSERT INTO public.challenge_feedback 
  (challenge_id, student_id, difficulty, clarity, enjoyment, comment, submitted_at)
VALUES
  -- Sample feedback for Challenge 1 from different students
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 
   'medium', 'clear', 'liked', 'Great problem! I learned a lot about algorithms.', now() - interval '2 days'),
  
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid,
   'hard', 'somewhat', 'struggled', 'The concept was hard to understand at first, but the hints helped.', now() - interval '2 days'),
  
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid,
   'easy', 'clear', 'loved', 'This was my favorite challenge! Very fun and engaging.', now() - interval '1 day'),
  
  -- Sample feedback for Challenge 2
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
   'medium', 'clear', 'okay', 'Good challenge but took longer than expected.', now() - interval '1 day'),
  
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid,
   'easy', 'clear', 'liked', 'Nice difficulty level, well explained instructions.', now() - interval '12 hours'),
  
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid,
   'hard', 'confusing', 'struggled', 'The description could be clearer. The hints were helpful though!', now() - interval '8 hours'),
  
  -- Sample feedback for Challenge 3
  ('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
   'medium', 'somewhat', 'liked', 'Interesting approach to problem solving.', now() - interval '6 hours'),
  
  ('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid,
   'easy', 'clear', 'loved', 'Perfect difficulty! I felt accomplished when I solved it.', now() - interval '4 hours'),
  
  ('550e8400-e29b-41d4-a716-446655440020'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid,
   'hard', 'clear', 'okay', 'Challenging but learnable. Good for stretching skills.', now() - interval '2 hours'),
  
  -- Sample feedback for Challenge 4
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid,
   'medium', 'clear', 'liked', 'Very well structured challenge.', now() - interval '1 hour'),
  
  ('550e8400-e29b-41d4-a716-446655440030'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid,
   'hard', 'somewhat', 'struggled', 'Could use more scaffolding but great learning opportunity.', now()),
  
  -- Sample feedback for Challenge 5
  ('550e8400-e29b-41d4-a716-446655440040'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid,
   'easy', 'clear', 'loved', 'This should be shown to all STEM classes!', now()),
  
  ('550e8400-e29b-41d4-a716-446655440040'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid,
   'medium', 'clear', 'liked', 'Good real-world application.', now())
ON CONFLICT (challenge_id, student_id) DO NOTHING;

-- Summary queries for presentation analytics

-- Query 1: Average difficulty rating by challenge
-- SELECT 
--   ch.title as "Challenge",
--   ROUND(100 * SUM(CASE WHEN cf.difficulty = 'easy' THEN 1 ELSE 0 END)::numeric / COUNT(*), 1) as "Easy %",
--   ROUND(100 * SUM(CASE WHEN cf.difficulty = 'medium' THEN 1 ELSE 0 END)::numeric / COUNT(*), 1) as "Medium %",
--   ROUND(100 * SUM(CASE WHEN cf.difficulty = 'hard' THEN 1 ELSE 0 END)::numeric / COUNT(*), 1) as "Hard %",
--   COUNT(*) as "Total Feedback"
-- FROM public.challenge_feedback cf
-- JOIN public.challenges ch ON ch.id = cf.challenge_id
-- GROUP BY ch.id, ch.title
-- ORDER BY ch.created_at;

-- Query 2: Enjoyment ratings summary
-- SELECT
--   CASE enjoyment
--     WHEN 'loved' THEN '😍 Loved'
--     WHEN 'liked' THEN '👍 Liked'
--     WHEN 'okay' THEN '😐 Okay'
--     WHEN 'struggled' THEN '😕 Struggled'
--   END as "Student Reaction",
--   COUNT(*) as "Count",
--   ROUND(100 * COUNT(*)::numeric / (SELECT COUNT(*) FROM public.challenge_feedback), 1) as "Percentage"
-- FROM public.challenge_feedback
-- GROUP BY enjoyment
-- ORDER BY
--   CASE enjoyment
--     WHEN 'loved' THEN 1
--     WHEN 'liked' THEN 2
--     WHEN 'okay' THEN 3
--     WHEN 'struggled' THEN 4
--   END;

-- Query 3: Clarity feedback summary
-- SELECT
--   clarity,
--   COUNT(*) as "Count",
--   ROUND(100 * COUNT(*)::numeric / (SELECT COUNT(*) FROM public.challenge_feedback), 1) as "Percentage"
-- FROM public.challenge_feedback
-- GROUP BY clarity
-- ORDER BY
--   CASE clarity
--     WHEN 'clear' THEN 1
--     WHEN 'somewhat' THEN 2
--     WHEN 'confusing' THEN 3
--   END;
