-- Step 1: Drop the incorrect table
DROP TABLE IF EXISTS public.challenge_feedback CASCADE;

-- Step 2: Create the correct challenge_feedback table
CREATE TABLE public.challenge_feedback (
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

-- Step 3: Create indexes
CREATE INDEX challenge_feedback_challenge_idx ON public.challenge_feedback (challenge_id);
CREATE INDEX challenge_feedback_student_idx ON public.challenge_feedback (student_id);

-- Step 4: Enable RLS
ALTER TABLE public.challenge_feedback ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "feedback: students submit for own classes"
  ON public.challenge_feedback for insert to authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges ch
      JOIN public.enrollments e ON e.class_id = ch.class_id
      WHERE ch.id = challenge_feedback.challenge_id
        AND e.student_id = auth.uid()
        AND ch.feedback_enabled
    )
  );

CREATE POLICY "feedback: students update own"
  ON public.challenge_feedback for update to authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "feedback: teachers read own classes"
  ON public.challenge_feedback for select to authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenges ch
      WHERE ch.id = challenge_feedback.challenge_id
        AND EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.class_id = ch.class_id
            AND e.role = 'teacher'
            AND e.student_id = auth.uid()
        )
    )
  );
