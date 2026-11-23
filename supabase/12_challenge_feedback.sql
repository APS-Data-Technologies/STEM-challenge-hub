-- =====================================================================
-- 12_challenge_feedback.sql
-- Add feedback collection feature:
-- 1. Add feedback_enabled flag to challenges
-- 2. Create feedback responses table
-- 3. Add security policies
-- Run after the existing migrations.
-- =====================================================================

-- Add feedback_enabled column to challenges table
alter table public.challenges
add column feedback_enabled boolean not null default false;

-- Create feedback responses table
create table public.challenge_feedback (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references public.challenges(id) on delete cascade,
  student_id      uuid not null references public.profiles(id) on delete cascade,
  difficulty      text check (difficulty in ('easy', 'medium', 'hard')),
  clarity         text check (clarity in ('clear', 'somewhat', 'confusing')),
  enjoyment       text check (enjoyment in ('loved', 'liked', 'okay', 'struggled')),
  comment         text check (length(comment) <= 500),
  submitted_at    timestamptz not null default now(),
  constraint one_feedback_per_student unique (challenge_id, student_id)
);

-- Index for looking up feedback by challenge
create index challenge_feedback_challenge_idx
  on public.challenge_feedback (challenge_id);

-- Index for looking up feedback by student
create index challenge_feedback_student_idx
  on public.challenge_feedback (student_id);

-- Security: Students can submit feedback for their class challenges
create policy "feedback: students submit for own classes"
  on public.challenge_feedback for insert to authenticated
  with check (
    exists (
      select 1 from public.challenges ch
      join public.enrollments e on e.class_id = ch.class_id
      where ch.id = feedback.challenge_id
        and e.student_id = auth.uid()
        and ch.feedback_enabled
    )
  );

-- Security: Students can update their own feedback
create policy "feedback: students update own"
  on public.challenge_feedback for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Security: Teachers can read feedback for their class challenges
create policy "feedback: teachers read own classes"
  on public.challenge_feedback for select to authenticated
  using (
    exists (
      select 1 from public.challenges ch
      where ch.id = feedback.challenge_id
        and public.teaches_challenge(ch.id)
    )
  );

-- Security: Teachers can update challenge feedback_enabled flag
-- (but not feedback responses themselves)
create policy "challenges: teachers update feedback_enabled"
  on public.challenges for update to authenticated
  using (public.teaches_challenge(challenges.id))
  with check (public.teaches_challenge(challenges.id));

enable row level security on challenge_feedback;
