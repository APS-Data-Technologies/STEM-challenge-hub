-- =====================================================================
-- 02_security.sql  ·  STEM Challenge Hub
-- Row-level security on every table + join_class / submit_answer.
-- Run SECOND, after 01_schema.sql.
-- =====================================================================

alter table public.profiles        enable row level security;
alter table public.classes         enable row level security;
alter table public.enrollments     enable row level security;
alter table public.challenges      enable row level security;
alter table public.challenge_keys  enable row level security;
alter table public.submissions     enable row level security;

-- ---------- helper checks --------------------------------------------
-- "security definer" lets these read tables without triggering each
-- other's policies (avoids infinite-recursion errors in RLS).

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.is_class_teacher(p_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.classes where id = p_class_id and teacher_id = auth.uid());
$$;

create or replace function public.is_enrolled(p_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments where class_id = p_class_id and student_id = auth.uid());
$$;

create or replace function public.teaches_challenge(p_challenge_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.challenges ch
    join public.classes c on c.id = ch.class_id
    where ch.id = p_challenge_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.teaches_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = p_student_id and c.teacher_id = auth.uid()
  );
$$;

-- ---------- profiles ---------------------------------------------------
-- Teacher: read/edit own; read names of students in their classes.
-- Student: read/edit own only. Nobody can change their own role.
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles: teacher reads own students"
  on public.profiles for select to authenticated
  using (public.teaches_student(id));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from anon, authenticated;
grant  update (display_name) on public.profiles to authenticated;

-- ---------- classes ----------------------------------------------------
create policy "classes: read own or enrolled"
  on public.classes for select to authenticated
  using (teacher_id = auth.uid() or public.is_enrolled(id));

create policy "classes: teacher creates"
  on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and public.is_teacher());

create policy "classes: teacher edits own"
  on public.classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "classes: teacher deletes own"
  on public.classes for delete to authenticated
  using (teacher_id = auth.uid());

-- ---------- enrollments -------------------------------------------------
-- No insert policy: students join only through join_class().
create policy "enrollments: read own or own class"
  on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_class_teacher(class_id));

create policy "enrollments: teacher removes from own class"
  on public.enrollments for delete to authenticated
  using (public.is_class_teacher(class_id));

-- ---------- challenges --------------------------------------------------
create policy "challenges: teacher full control in own classes"
  on public.challenges for all to authenticated
  using (public.is_class_teacher(class_id))
  with check (public.is_class_teacher(class_id) and created_by = auth.uid());

create policy "challenges: student reads published in their classes"
  on public.challenges for select to authenticated
  using (is_published and public.is_enrolled(class_id));

-- ---------- challenge_keys (students: no policy = no access) ------------
create policy "challenge_keys: teacher manages own"
  on public.challenge_keys for all to authenticated
  using (public.teaches_challenge(challenge_id))
  with check (public.teaches_challenge(challenge_id));

-- ---------- submissions --------------------------------------------------
-- No student insert/update policy: students submit through submit_answer().
-- Teachers may update only is_correct after evaluating a response.
create policy "submissions: student reads own"
  on public.submissions for select to authenticated
  using (student_id = auth.uid());

create policy "submissions: teacher reads own classes"
  on public.submissions for select to authenticated
  using (public.teaches_challenge(challenge_id));

-- Only teachers of the challenge's class can evaluate short answers.
revoke update on public.submissions from anon, authenticated;
grant update (is_correct) on public.submissions to authenticated;

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

-- =====================================================================
-- Database functions called from the app with supabase.rpc(...)
-- =====================================================================

-- join_class(code): adds the signed-in student to the class.
-- Wrong code -> error. Joining twice -> nothing happens.
-- Returns the class id.
create or replace function public.join_class(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student') then
    raise exception 'Only students can join a class';
  end if;

  select c.id into v_class_id
  from public.classes c
  where c.join_code = upper(trim(join_class.code));

  if v_class_id is null then
    raise exception 'Invalid join code';
  end if;

  insert into public.enrollments (class_id, student_id)
  values (v_class_id, auth.uid())
  on conflict do nothing;

  return v_class_id;
end
$$;

-- submit_answer(challenge_id, answer): grades multiple-choice answers here;
-- short answers are saved for their teacher to review.
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

  -- Same error for "doesn't exist", "not published" and "not your class",
  -- so students can't probe other classes.
  if v_class_id is null or not v_published
     or not exists (select 1 from public.enrollments e
                    where e.class_id = v_class_id and e.student_id = auth.uid()) then
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

  insert into public.submissions (challenge_id, student_id, answer, is_correct, submitted_at)
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

-- Only signed-in users may call the two app functions.
revoke execute on function public.join_class(text)          from public, anon;
revoke execute on function public.submit_answer(uuid, text) from public, anon;
grant  execute on function public.join_class(text)          to authenticated;
grant  execute on function public.submit_answer(uuid, text) to authenticated;
