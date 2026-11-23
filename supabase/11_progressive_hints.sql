-- Optional progressive hints for multiple choice questions.
-- Run after 01_schema.sql. This adds support for 3 levels of hints
-- that are shown progressively on wrong answers.
begin;

-- Add hint columns to challenges table
alter table public.challenges add column if not exists hint_level_1 text;
alter table public.challenges add column if not exists hint_level_2 text;
alter table public.challenges add column if not exists hint_level_3 text;

-- Add comments explaining the hints
comment on column public.challenges.hint_level_1 is
  'First hint shown after first wrong answer - general guidance';
comment on column public.challenges.hint_level_2 is
  'Second hint shown after second wrong answer - more specific';
comment on column public.challenges.hint_level_3 is
  'Third hint shown after third wrong answer - nearly gives away answer';

-- Track wrong answer attempts per student per challenge for hint tracking
create table if not exists public.answer_attempts (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.challenges(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  wrong_count   smallint not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(challenge_id, student_id)
);

-- Enable RLS for answer_attempts
alter table public.answer_attempts enable row level security;

-- Students can only view their own attempt tracking
create policy "answer_attempts: student reads own"
  on public.answer_attempts for select to authenticated using (
    student_id = auth.uid()
  );

-- Students can update their own attempt tracking
create policy "answer_attempts: student updates own"
  on public.answer_attempts for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- System can insert attempt tracking
create policy "answer_attempts: insert on submission"
  on public.answer_attempts for insert to authenticated with check (true);

-- Teachers can view attempt tracking for their class
create policy "answer_attempts: teacher reads in own classes"
  on public.answer_attempts for select to authenticated using (
    exists (
      select 1 from public.challenges ch
      join public.classes c on c.id = ch.class_id
      where ch.id = answer_attempts.challenge_id
      and c.teacher_id = auth.uid()
    )
  );

commit;
