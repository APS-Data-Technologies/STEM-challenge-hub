-- =====================================================================
-- 05_scope_multiple_choice_feedback.sql
-- Match the v1 scope: grade multiple-choice answers in the database and
-- leave short answers for teacher review.
-- Run once after the existing Supabase migrations.
-- =====================================================================

do $$
begin
  if exists (
    select 1
    from public.submissions s
    join public.challenges ch on ch.id = s.challenge_id
    left join public.challenge_keys ck on ck.challenge_id = ch.id
    where ch.answer_type = 'multiple_choice'
      and ck.challenge_id is null
  ) then
    raise exception
      'Cannot grade existing multiple-choice submissions: a challenge answer key is missing';
  end if;
end
$$;

update public.submissions s
set is_correct = (s.answer = ck.correct_choice)
from public.challenges ch
join public.challenge_keys ck on ck.challenge_id = ch.id
where s.challenge_id = ch.id
  and ch.answer_type = 'multiple_choice';

revoke update on public.submissions from anon, authenticated;
grant update (is_correct) on public.submissions to authenticated;

drop policy if exists "submissions: teacher evaluates own classes"
  on public.submissions;

create policy "submissions: teacher evaluates own classes"
  on public.submissions for update to authenticated
  using (
    public.teaches_challenge(submissions.challenge_id)
    and exists (
      select 1 from public.challenges ch
      where ch.id = submissions.challenge_id and ch.answer_type = 'short_answer'
    )
  )
  with check (
    public.teaches_challenge(submissions.challenge_id)
    and exists (
      select 1 from public.challenges ch
      where ch.id = submissions.challenge_id and ch.answer_type = 'short_answer'
    )
  );

drop function if exists public.submit_answer(uuid, text);

create or replace function public.submit_answer(challenge_id uuid, answer text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_class_id    uuid;
  v_published   boolean;
  v_answer_type text;
  v_is_correct  boolean;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if submit_answer.answer is null or length(trim(submit_answer.answer)) = 0 then
    raise exception 'Answer is empty';
  end if;

  select ch.class_id, ch.is_published, ch.answer_type
    into v_class_id, v_published, v_answer_type
  from public.challenges ch
  where ch.id = submit_answer.challenge_id;

  if v_class_id is null or not v_published
     or not exists (
       select 1 from public.enrollments e
       where e.class_id = v_class_id and e.student_id = auth.uid()
     ) then
    raise exception 'Challenge not found';
  end if;

  if v_answer_type = 'multiple_choice' then
    select ck.correct_choice = trim(submit_answer.answer)
      into v_is_correct
    from public.challenge_keys ck
    where ck.challenge_id = submit_answer.challenge_id;

    if v_is_correct is null then
      raise exception 'Challenge answer key is not configured';
    end if;
  else
    v_is_correct := null;
  end if;

  insert into public.submissions (
    challenge_id, student_id, answer, is_correct, submitted_at
  )
  values (
    submit_answer.challenge_id,
    auth.uid(),
    trim(submit_answer.answer),
    v_is_correct,
    now()
  )
  on conflict on constraint one_submission_per_student do update
    set answer       = excluded.answer,
        is_correct   = excluded.is_correct,
        submitted_at = excluded.submitted_at;

  return v_is_correct;
end
$$;

revoke execute on function public.submit_answer(uuid, text) from public, anon;
grant execute on function public.submit_answer(uuid, text) to authenticated;
