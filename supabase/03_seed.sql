-- =====================================================================
-- 03_seed.sql  ·  STEM Challenge Hub  ·  FICTIONAL DEMO DATA ONLY
-- 2 teachers, 3 classes, 15 students, 10 original challenges,
-- a few sample submissions. Safe to re-run (skips what already exists).
-- Run THIRD, after 01 and 02.
--
-- Every demo account uses the password:  DemoPass123!
--   teacher1@example.com, teacher2@example.com
--   student01@example.com ... student15@example.com
-- =====================================================================

-- ---------- 1. Demo users (profiles are created by the sign-up trigger)
with new_users(email, display_name, role) as (
  values
    ('teacher1@example.com',  'Ms. Rivera',   'teacher'),
    ('teacher2@example.com',  'Mr. Okafor',   'teacher'),
    ('student01@example.com', 'Avery B.',     'student'),
    ('student02@example.com', 'Jordan C.',    'student'),
    ('student03@example.com', 'Riley D.',     'student'),
    ('student04@example.com', 'Sam E.',       'student'),
    ('student05@example.com', 'Taylor F.',    'student'),
    ('student06@example.com', 'Morgan G.',    'student'),
    ('student07@example.com', 'Casey H.',     'student'),
    ('student08@example.com', 'Quinn J.',     'student'),
    ('student09@example.com', 'Rowan K.',     'student'),
    ('student10@example.com', 'Emery L.',     'student'),
    ('student11@example.com', 'Finley M.',    'student'),
    ('student12@example.com', 'Harper N.',    'student'),
    ('student13@example.com', 'Kai P.',       'student'),
    ('student14@example.com', 'Logan R.',     'student'),
    ('student15@example.com', 'Sage T.',      'student')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  nu.email, extensions.crypt('DemoPass123!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('role', nu.role, 'display_name', nu.display_name),
  now(), now(), '', '', '', ''
from new_users nu
where not exists (select 1 from auth.users u where u.email = nu.email);

-- Email identities so the demo accounts can sign in with a password
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@example.com'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- ---------- 2. Classes (fixed join codes so they're easy to demo) ------
insert into public.classes (teacher_id, name, join_code)
select u.id, c.name, c.code
from (values
  ('teacher1@example.com', 'Grade 7 Science',     'SCI7A2'),
  ('teacher1@example.com', 'Grade 8 Math',        'MTH8B4'),
  ('teacher2@example.com', 'Grade 5 Engineering', 'ENG5C9')
) as c(email, name, code)
join auth.users u on u.email = c.email
on conflict (join_code) do nothing;

-- ---------- 3. Enrollments ---------------------------------------------
-- Students 01–08 in Science, 05–11 in Math (05–08 are in both), 12–15 in Engineering
insert into public.enrollments (class_id, student_id)
select c.id, u.id
from (values ('SCI7A2', 1, 8), ('MTH8B4', 5, 11), ('ENG5C9', 12, 15)) as r(code, lo, hi)
join public.classes c on c.join_code = r.code
cross join generate_series(r.lo, r.hi) as n
join auth.users u on u.email = format('student%s@example.com', lpad(n::text, 2, '0'))
on conflict do nothing;

-- ---------- 4. Challenges (original content) ---------------------------
insert into public.challenges (class_id, created_by, title, prompt, subject, grade_band, answer_type, choices, is_published)
select c.id, c.teacher_id, v.title, v.prompt, v.subject, v.grade_band, v.answer_type, v.choices::jsonb, v.is_published
from (values
  ('SCI7A2', 'Ice cube race',
   'Two identical ice cubes sit at room temperature: one on a metal tray, one on a wooden cutting board. Which melts first?',
   'Science', '6-8', 'multiple_choice', '["Metal tray","Wooden board","Same time"]', true),
  ('SCI7A2', 'Plant in the dark',
   'Predict what happens to a houseplant kept in a dark closet for one week. Explain why in 1–2 sentences.',
   'Science', '6-8', 'short_answer', null, true),
  ('SCI7A2', 'Density check',
   'An object has a mass of 20 g and a volume of 10 cm³. What is its density?',
   'Science', '6-8', 'multiple_choice', '["0.5 g/cm³","2 g/cm³","30 g/cm³","200 g/cm³"]', false),  -- draft
  ('MTH8B4', 'Slope finder',
   'What is the slope of the line through the points (1, 2) and (3, 8)?',
   'Math', '6-8', 'multiple_choice', '["2","3","4","6"]', true),
  ('MTH8B4', 'Pattern puzzle',
   'What number comes next: 2, 6, 18, 54, ... ?',
   'Math', '6-8', 'multiple_choice', '["72","108","162","216"]', true),
  ('MTH8B4', 'Loop logic',
   'A program sets x = 1, then keeps doubling x while x is 20 or less. What is x when the loop stops?',
   'Technology', '6-8', 'multiple_choice', '["16","20","32","40"]', true),
  ('MTH8B4', 'Estimation strategy',
   'Describe how you would estimate the number of windows in your school without counting every one.',
   'Math', '6-8', 'short_answer', null, true),
  ('ENG5C9', 'Strongest shape',
   'Which shape do engineers often use in bridges because it keeps its shape when weight presses on it?',
   'Engineering', '3-5', 'multiple_choice', '["Square","Triangle","Circle"]', true),
  ('ENG5C9', 'Paper tower',
   'You have 10 sheets of paper and some tape. Describe one idea for building the tallest tower that stands on its own.',
   'Engineering', '3-5', 'short_answer', null, true),
  ('ENG5C9', 'Drop test',
   'Indoors, you drop a crumpled paper ball and a flat sheet of paper from the same height. Which lands first?',
   'Science', '3-5', 'multiple_choice', '["Crumpled ball","Flat sheet","Same time"]', true)
) as v(code, title, prompt, subject, grade_band, answer_type, choices, is_published)
join public.classes c on c.join_code = v.code
where not exists (select 1 from public.challenges x where x.class_id = c.id and x.title = v.title);

-- ---------- 5. Answer keys ---------------------------------------------
insert into public.challenge_keys (challenge_id, correct_choice)
select ch.id, k.correct
from (values
  ('SCI7A2', 'Ice cube race',   'Metal tray'),
  ('SCI7A2', 'Density check',   '2 g/cm³'),
  ('MTH8B4', 'Slope finder',    '3'),
  ('MTH8B4', 'Pattern puzzle',  '162'),
  ('MTH8B4', 'Loop logic',      '32'),
  ('ENG5C9', 'Strongest shape', 'Triangle'),
  ('ENG5C9', 'Drop test',       'Crumpled ball')
) as k(code, title, correct)
join public.classes c on c.join_code = k.code
join public.challenges ch on ch.class_id = c.id and ch.title = k.title
on conflict (challenge_id) do update set correct_choice = excluded.correct_choice;

-- ---------- 6. A few sample submissions (so the progress table isn't empty)
insert into public.submissions (challenge_id, student_id, answer, is_correct)
select ch.id, u.id, s.answer,
       case when ch.answer_type = 'multiple_choice' then s.answer = k.correct_choice end
from (values
  ('student01@example.com', 'SCI7A2', 'Ice cube race',     'Metal tray'),
  ('student02@example.com', 'SCI7A2', 'Ice cube race',     'Metal tray'),
  ('student03@example.com', 'SCI7A2', 'Ice cube race',     'Wooden board'),
  ('student04@example.com', 'SCI7A2', 'Ice cube race',     'Same time'),
  ('student01@example.com', 'SCI7A2', 'Plant in the dark', 'It turns pale and droopy because it cannot make food without light.'),
  ('student05@example.com', 'MTH8B4', 'Slope finder',      '3'),
  ('student06@example.com', 'MTH8B4', 'Slope finder',      '4'),
  ('student09@example.com', 'MTH8B4', 'Pattern puzzle',    '162'),
  ('student12@example.com', 'ENG5C9', 'Strongest shape',   'Triangle'),
  ('student13@example.com', 'ENG5C9', 'Strongest shape',   'Square')
) as s(email, code, title, answer)
join auth.users u on u.email = s.email
join public.classes c on c.join_code = s.code
join public.challenges ch on ch.class_id = c.id and ch.title = s.title
left join public.challenge_keys k on k.challenge_id = ch.id
on conflict on constraint one_submission_per_student do nothing;
