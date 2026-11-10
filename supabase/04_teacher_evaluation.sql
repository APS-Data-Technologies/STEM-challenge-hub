-- =====================================================================
-- 04_teacher_evaluation.sql · Historical teacher-gated-results migration.
-- Superseded by 05_scope_multiple_choice_feedback.sql. Do not run on new
-- projects; running it on an existing project clears saved evaluation results.
-- =====================================================================

-- Existing results were assigned automatically by submit_answer().
-- Clear them so every response must be reviewed by its teacher.
update public.submissions
set is_correct = null
where is_correct is not null;

revoke update on public.submissions from anon, authenticated;
grant update (is_correct) on public.submissions to authenticated;

drop policy if exists "submissions: teacher evaluates own classes"
  on public.submissions;

create policy "submissions: teacher evaluates own classes"
  on public.submissions for update to authenticated
  using (public.teaches_challenge(challenge_id))
  with check (public.teaches_challenge(challenge_id));

create or replace function public.submit_answer(challenge_id uuid, answer text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_class_id  uuid;
  v_published boolean;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if submit_answer.answer is null or length(trim(submit_answer.answer)) = 0 then
    raise exception 'Answer is empty';
  end if;

  select ch.class_id, ch.is_published
    into v_class_id, v_published
  from public.challenges ch
  where ch.id = submit_answer.challenge_id;

  if v_class_id is null or not v_published
     or not exists (select 1 from public.enrollments e
                    where e.class_id = v_class_id and e.student_id = auth.uid()) then
    raise exception 'Challenge not found';
  end if;

  insert into public.submissions (challenge_id, student_id, answer, is_correct, submitted_at)
  values (submit_answer.challenge_id, auth.uid(), trim(submit_answer.answer), null, now())
  on conflict on constraint one_submission_per_student do update
    set answer       = excluded.answer,
        is_correct   = null,
        submitted_at = excluded.submitted_at;

  return 'submitted';
end
$$;

revoke execute on function public.submit_answer(uuid, text) from public, anon;
grant execute on function public.submit_answer(uuid, text) to authenticated;
