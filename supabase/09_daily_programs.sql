-- Daily programs are separate from existing single-question challenges.
begin;

create table public.daily_programs (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null default auth.uid() references public.profiles(id),
  title text not null check (length(trim(title)) between 1 and 100),
  subject text not null check (subject in ('Science', 'Technology', 'Engineering', 'Math')),
  grade_band text not null check (grade_band in ('K-2', '3-5', '6-8', '9-12')),
  days smallint not null check (days between 1 and 100),
  start_date date not null,
  start_time time not null,
  time_zone text not null,
  easy_count integer not null check (easy_count >= 0),
  medium_count integer not null check (medium_count >= 0),
  hard_count integer not null check (hard_count >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check (easy_count + medium_count + hard_count between days and days * 10)
);

create table public.daily_program_questions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.daily_programs(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 100),
  position smallint not null check (position between 1 and 10),
  level text not null check (level in ('Easy', 'Medium', 'Hard')),
  title text not null check (length(trim(title)) between 1 and 100),
  prompt text not null check (length(trim(prompt)) between 1 and 2000),
  answer_type text not null check (answer_type in ('multiple_choice', 'short_answer')),
  choices jsonb,
  unique (program_id, day_number, position),
  check (
    (answer_type = 'short_answer' and choices is null)
    or (answer_type = 'multiple_choice' and choices is not null and jsonb_typeof(choices) = 'array'
        and jsonb_array_length(choices) between 2 and 6)
  )
);

create table public.daily_program_keys (
  question_id uuid primary key references public.daily_program_questions(id) on delete cascade,
  correct_choice text not null check (length(trim(correct_choice)) > 0)
);

create table public.daily_program_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.daily_program_questions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null check (length(trim(answer)) > 0),
  is_correct boolean,
  first_submitted_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  unique (question_id, student_id)
);

create index daily_programs_class_idx on public.daily_programs(class_id);
create index daily_program_questions_program_idx on public.daily_program_questions(program_id, day_number);
create index daily_program_answers_student_idx on public.daily_program_answers(student_id);

create function public.daily_program_opens_at(p_date date, p_time time, p_zone text, p_day integer)
returns timestamptz
language sql stable
set search_path = ''
as $$
  select (p_date + (p_day - 1) + p_time) at time zone p_zone
$$;

-- Serialize changes to a program with publication and answer submission.
create function public.check_daily_program_question_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_program public.daily_programs%rowtype;
  v_program_id uuid;
begin
  if tg_table_name = 'daily_program_keys' then
    if tg_op = 'UPDATE' and new.question_id <> old.question_id then
      raise exception 'An answer key cannot be moved to another question';
    end if;
    select q.program_id into v_program_id
    from public.daily_program_questions q
    where q.id = case when tg_op = 'DELETE' then old.question_id else new.question_id end;
  else
    v_program_id := case when tg_op = 'DELETE' then old.program_id else new.program_id end;
    if tg_op = 'UPDATE' and new.program_id <> old.program_id then
      raise exception 'A question cannot be moved to another program';
    end if;
  end if;

  select * into v_program from public.daily_programs p
  where p.id = v_program_id for update;
  if not found then
    if tg_op = 'DELETE' then return old; end if;
    raise exception 'Daily program not found';
  end if;
  if v_program.is_published then
    raise exception 'Unpublish the daily program before changing its questions or answer keys';
  end if;
  if exists (
    select 1 from public.daily_program_answers a
    join public.daily_program_questions q on q.id = a.question_id
    where q.program_id = v_program_id
  ) then
    raise exception 'A daily program cannot be changed after students have answered';
  end if;
  if tg_table_name = 'daily_program_questions' and tg_op <> 'DELETE' then
    if new.day_number > v_program.days then
      raise exception 'Question day exceeds the number of program days';
    end if;
    if new.answer_type = 'multiple_choice' then
      if new.choices is null or pg_catalog.jsonb_typeof(new.choices) <> 'array' then
        raise exception 'Multiple-choice questions need an array of choices';
      end if;
      if exists (
        select 1 from pg_catalog.jsonb_array_elements(new.choices) choice
        where pg_catalog.jsonb_typeof(choice) <> 'string'
           or length(trim(choice #>> '{}')) = 0
      ) or (
        select count(*) <> count(distinct lower(trim(choice #>> '{}')))
        from pg_catalog.jsonb_array_elements(new.choices) choice
      ) then
        raise exception 'Choices must be nonempty and unique';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

create trigger daily_program_questions_guard
before insert or update or delete on public.daily_program_questions
for each row execute function public.check_daily_program_question_change();

create trigger daily_program_keys_guard
before insert or update or delete on public.daily_program_keys
for each row execute function public.check_daily_program_question_change();

create function public.check_daily_program()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = new.time_zone) then
    raise exception 'Choose a valid time zone';
  end if;
  if tg_op = 'UPDATE' and exists (
    select 1 from public.daily_program_answers a
    join public.daily_program_questions q on q.id = a.question_id
    where q.program_id = old.id
  ) then
    raise exception 'A daily program cannot be changed after students have answered';
  end if;
  if new.is_published then
    if exists (
      select 1 from pg_catalog.generate_series(1, new.days) d(day_number)
      where not exists (
        select 1 from public.daily_program_questions q
        where q.program_id = new.id and q.day_number = d.day_number
      )
    ) or exists (
      select 1 from public.daily_program_questions q
      where q.program_id = new.id and q.day_number > new.days
    ) then
      raise exception 'Every day must have between 1 and 10 questions';
    end if;
    if (select count(*) from public.daily_program_questions q where q.program_id = new.id and q.level = 'Easy') <> new.easy_count
       or (select count(*) from public.daily_program_questions q where q.program_id = new.id and q.level = 'Medium') <> new.medium_count
       or (select count(*) from public.daily_program_questions q where q.program_id = new.id and q.level = 'Hard') <> new.hard_count then
      raise exception 'Question counts must match the planned difficulty counts';
    end if;
    if exists (
      select 1 from public.daily_program_questions q
      left join public.daily_program_keys k on k.question_id = q.id
      where q.program_id = new.id and q.answer_type = 'multiple_choice'
        and (k.question_id is null or not q.choices @> pg_catalog.jsonb_build_array(k.correct_choice))
    ) then
      raise exception 'Every multiple-choice question needs a correct answer from its choices';
    end if;
  end if;
  return new;
end
$$;

create trigger daily_program_guard
before insert or update on public.daily_programs
for each row execute function public.check_daily_program();

alter table public.daily_programs enable row level security;
alter table public.daily_program_questions enable row level security;
alter table public.daily_program_keys enable row level security;
alter table public.daily_program_answers enable row level security;

create policy "daily programs: teachers manage their classes"
on public.daily_programs for all to authenticated
using (public.is_class_teacher(class_id))
with check (public.is_class_teacher(class_id) and created_by = auth.uid());

create policy "daily programs: students read published programs"
on public.daily_programs for select to authenticated
using (is_published and public.is_enrolled(class_id));

create policy "daily questions: teachers manage their classes"
on public.daily_program_questions for all to authenticated
using (exists (
  select 1 from public.daily_programs p
  where p.id = program_id and public.is_class_teacher(p.class_id)
))
with check (exists (
  select 1 from public.daily_programs p
  where p.id = program_id and public.is_class_teacher(p.class_id)
));

create policy "daily questions: students read unlocked questions"
on public.daily_program_questions for select to authenticated
using (exists (
  select 1 from public.daily_programs p
  where p.id = program_id and p.is_published and public.is_enrolled(p.class_id)
    and now() >= public.daily_program_opens_at(p.start_date, p.start_time, p.time_zone, day_number)
));

create policy "daily keys: teachers manage their classes"
on public.daily_program_keys for all to authenticated
using (exists (
  select 1 from public.daily_program_questions q
  join public.daily_programs p on p.id = q.program_id
  where q.id = question_id and public.is_class_teacher(p.class_id)
))
with check (exists (
  select 1 from public.daily_program_questions q
  join public.daily_programs p on p.id = q.program_id
  where q.id = question_id and public.is_class_teacher(p.class_id)
));

create policy "daily answers: students read their own"
on public.daily_program_answers for select to authenticated
using (student_id = auth.uid());

create policy "daily answers: teachers read their classes"
on public.daily_program_answers for select to authenticated
using (exists (
  select 1 from public.daily_program_questions q
  join public.daily_programs p on p.id = q.program_id
  where q.id = question_id and public.is_class_teacher(p.class_id)
));

revoke insert, update, delete on public.daily_program_answers from anon, authenticated;

create function public.submit_daily_program_answer(p_question_id uuid, p_answer text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_question public.daily_program_questions%rowtype;
  v_program public.daily_programs%rowtype;
  v_correct boolean;
  v_submitted_at timestamptz;
begin
  if auth.uid() is null or p_answer is null or length(trim(p_answer)) = 0 then
    raise exception 'Sign in and enter an answer';
  end if;
  select q.* into v_question from public.daily_program_questions q where q.id = p_question_id;
  if not found then raise exception 'Question not found'; end if;
  select p.* into v_program from public.daily_programs p
  where p.id = v_question.program_id for update;
  select q.* into v_question from public.daily_program_questions q
  where q.id = p_question_id and q.program_id = v_program.id;
  v_submitted_at := pg_catalog.clock_timestamp();
  if not found or not v_program.is_published or not public.is_enrolled(v_program.class_id)
     or v_submitted_at < public.daily_program_opens_at(v_program.start_date, v_program.start_time, v_program.time_zone, v_question.day_number) then
    raise exception 'Question not available';
  end if;
  if v_question.answer_type = 'multiple_choice' then
    if not v_question.choices @> pg_catalog.jsonb_build_array(trim(p_answer)) then
      raise exception 'Choose one of the available answers';
    end if;
    select k.correct_choice = trim(p_answer) into v_correct
    from public.daily_program_keys k where k.question_id = p_question_id;
    if not found then raise exception 'Answer key not configured'; end if;
  end if;
  insert into public.daily_program_answers (question_id, student_id, answer, is_correct, first_submitted_at, submitted_at)
  values (p_question_id, auth.uid(), trim(p_answer), v_correct, v_submitted_at, v_submitted_at)
  on conflict (question_id, student_id) do update
  set answer = excluded.answer, is_correct = excluded.is_correct, submitted_at = excluded.submitted_at;
  return v_correct;
end
$$;

create function public.review_daily_program_answer(p_answer_id uuid, p_is_correct boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_is_correct is null then raise exception 'Choose a review result'; end if;
  update public.daily_program_answers a set is_correct = p_is_correct
  from public.daily_program_questions q, public.daily_programs p
  where a.id = p_answer_id and q.id = a.question_id and p.id = q.program_id
    and q.answer_type = 'short_answer' and public.is_class_teacher(p.class_id);
  if not found then raise exception 'Answer not found or not available for review'; end if;
end
$$;

create function public.get_daily_program_progress(p_program_id uuid, p_student_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_program public.daily_programs%rowtype;
  v_today integer;
  v_completed integer;
  v_longest integer;
  v_current integer;
  v_answered integer;
begin
  select * into v_program from public.daily_programs p where p.id = p_program_id;
  if auth.uid() is null or not found or not v_program.is_published
     or not exists (
       select 1 from public.enrollments e
       where e.class_id = v_program.class_id and e.student_id = p_student_id
     )
     or not (auth.uid() = p_student_id or public.is_class_teacher(v_program.class_id)) then
    raise exception 'Program progress not available';
  end if;
  v_today := ((now() at time zone v_program.time_zone)::date - v_program.start_date) + 1;
  if (now() at time zone v_program.time_zone)::time < v_program.start_time then
    v_today := v_today - 1;
  end if;
  select count(*) into v_answered
  from public.daily_program_answers a
  join public.daily_program_questions q on q.id = a.question_id
  where q.program_id = p_program_id and a.student_id = p_student_id;

  with completed as (
    select q.day_number
    from public.daily_program_questions q
    left join public.daily_program_answers a
      on a.question_id = q.id and a.student_id = p_student_id
    where q.program_id = p_program_id
    group by q.day_number
    having count(*) = count(*) filter (
      where a.first_submitted_at >= public.daily_program_opens_at(v_program.start_date, v_program.start_time, v_program.time_zone, q.day_number)
        and a.first_submitted_at < public.daily_program_opens_at(v_program.start_date, v_program.start_time, v_program.time_zone, q.day_number + 1)
    )
  ), numbered as (
    select day_number, day_number - row_number() over (order by day_number) as grp
    from completed
  ), runs as (
    select count(*)::integer as length, max(day_number) as last_day
    from numbered group by grp
  )
  select coalesce(sum(length), 0)::integer, coalesce(max(length), 0)::integer,
    coalesce(max(length) filter (where last_day in (v_today, v_today - 1)), 0)::integer
  into v_completed, v_longest, v_current from runs;

  return pg_catalog.jsonb_build_object(
    'total_questions', v_program.easy_count + v_program.medium_count + v_program.hard_count,
    'answered_questions', v_answered,
    'completed_days', v_completed,
    'current_streak', v_current,
    'longest_streak', v_longest
  );
end
$$;

revoke execute on function public.submit_daily_program_answer(uuid, text) from public, anon;
revoke execute on function public.review_daily_program_answer(uuid, boolean) from public, anon;
revoke execute on function public.get_daily_program_progress(uuid, uuid) from public, anon;
grant execute on function public.submit_daily_program_answer(uuid, text) to authenticated;
grant execute on function public.review_daily_program_answer(uuid, boolean) to authenticated;
grant execute on function public.get_daily_program_progress(uuid, uuid) to authenticated;

commit;
