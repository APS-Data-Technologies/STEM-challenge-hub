-- =====================================================================
-- 01_schema.sql  ·  STEM Challenge Hub
-- Tables, constraints and the trigger that creates a profile on sign-up.
-- Run FIRST in the Supabase SQL editor on an empty project.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- profiles: one row per user -------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('teacher', 'student')),
  display_name  text not null,
  created_at    timestamptz not null default now()
);

-- ---------- join codes: 6 chars, no look-alikes (0/O, 1/I/L) --------
create or replace function public.generate_join_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end
$$;

-- ---------- classes ---------------------------------------------------
create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  join_code   text not null unique default public.generate_join_code(),
  created_at  timestamptz not null default now()
);

-- ---------- enrollments (no duplicates) -------------------------------
create table public.enrollments (
  class_id    uuid not null references public.classes(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- ---------- challenges ------------------------------------------------
create table public.challenges (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes(id) on delete cascade,
  created_by    uuid not null default auth.uid() references public.profiles(id),
  title         text not null check (length(trim(title)) > 0),
  prompt        text not null check (length(trim(prompt)) > 0),
  subject       text not null check (subject in ('Science', 'Technology', 'Engineering', 'Math')),
  grade_band    text not null check (grade_band in ('K-2', '3-5', '6-8', '9-12')),
  answer_type   text not null check (answer_type in ('multiple_choice', 'short_answer')),
  choices       jsonb,            -- e.g. ["Triangle","Square","Circle"]; null for short answer
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint choices_required_for_mc check (
    answer_type = 'short_answer'
    or (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) >= 2)
  )
);

-- ---------- challenge_keys: correct answers (students never see) ----
create table public.challenge_keys (
  challenge_id    uuid primary key references public.challenges(id) on delete cascade,
  correct_choice  text not null   -- must match one of the challenge's choices exactly
);

-- ---------- submissions: one (latest) answer per student per challenge
create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.challenges(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  answer        text not null,
  is_correct    boolean,          -- null for short answer
  submitted_at  timestamptz not null default now(),
  constraint one_submission_per_student unique (challenge_id, student_id)
);

-- ---------- indexes for the lookups the app does most -----------------
create index classes_teacher_idx      on public.classes (teacher_id);
create index enrollments_student_idx  on public.enrollments (student_id);
create index challenges_class_idx     on public.challenges (class_id);
create index submissions_student_idx  on public.submissions (student_id);

-- ---------- create a profile automatically when someone signs up ------
-- The frontend passes role + display_name in supabase.auth.signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher' else 'student' end,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  );
  return new;
end
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
