-- Optional private profile photos. Run after 01_schema.sql and 02_security.sql.
begin;

alter table public.profiles add column if not exists avatar_path text;

alter table public.profiles drop constraint if exists profiles_avatar_path_owner;
alter table public.profiles add constraint profiles_avatar_path_owner check (
  avatar_path is null or (
    split_part(avatar_path, '/', 1) = id::text
    and split_part(avatar_path, '/', 2) <> ''
    and split_part(avatar_path, '/', 3) = ''
  )
);
grant update (avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'profile-photos' and public = false and file_size_limit = 2097152
      and allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  ) then
    raise exception 'Existing profile-photos bucket has incompatible privacy or file restrictions';
  end if;
end
$$;

create or replace function public.can_read_profile_photo(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles p
    where p.avatar_path = p_name and (
      p.id = auth.uid() or exists (
        select 1 from public.classes c
        where (c.teacher_id = auth.uid() or exists (
          select 1 from public.enrollments e where e.class_id = c.id and e.student_id = auth.uid()
        ))
        and (c.teacher_id = p.id or exists (
          select 1 from public.enrollments e where e.class_id = c.id and e.student_id = p.id
        ))
      )
    )
  );
$$;
revoke all on function public.can_read_profile_photo(text) from public, anon;
grant execute on function public.can_read_profile_photo(text) to authenticated;

drop policy if exists "profile photos: read own or shared class" on storage.objects;
create policy "profile photos: read own or shared class" on storage.objects
  for select to authenticated using (
    bucket_id = 'profile-photos' and (
      split_part(name, '/', 1) = auth.uid()::text
      or public.can_read_profile_photo(name)
    )
  );
drop policy if exists "profile photos: upload own" on storage.objects;
create policy "profile photos: upload own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = auth.uid()::text
    and split_part(name, '/', 2) <> ''
    and split_part(name, '/', 3) = ''
  );
drop policy if exists "profile photos: delete own" on storage.objects;
create policy "profile photos: delete own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-photos' and split_part(name, '/', 1) = auth.uid()::text
  );

commit;
