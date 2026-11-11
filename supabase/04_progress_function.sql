-- Teacher progress table: one row per student per published challenge.
-- Only the class's own teacher gets data.
create or replace function public.get_class_progress(p_class_id uuid)
returns table (
  student_id uuid,
  student_name text,
  challenge_id uuid,
  challenge_title text,
  attempts int,
  latest_is_correct boolean,
  last_submitted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.student_id,
         p.display_name,
         ch.id,
         ch.title,
         count(s.id)::int,
         (array_agg(s.is_correct order by s.submitted_at desc)
            filter (where s.id is not null))[1],
         max(s.submitted_at)
  from public.enrollments e
  join public.profiles p    on p.id = e.student_id
  join public.challenges ch on ch.class_id = e.class_id and ch.is_published
  left join public.submissions s
         on s.student_id = e.student_id and s.challenge_id = ch.id
  where e.class_id = p_class_id
    and exists (select 1 from public.classes c
                where c.id = p_class_id and c.teacher_id = auth.uid())
  group by e.student_id, p.display_name, ch.id, ch.title
  order by p.display_name, ch.title;
$$;

revoke execute on function public.get_class_progress(uuid) from public, anon;
grant execute on function public.get_class_progress(uuid) to authenticated;
