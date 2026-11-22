const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const { join } = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

test('profile photo storage is private to the owner and shared-class members', async () => {
  const db = new PGlite()
  const teacher = '00000000-0000-0000-0000-000000000001'
  const student = '00000000-0000-0000-0000-000000000002'
  const classmate = '00000000-0000-0000-0000-000000000003'
  const outsider = '00000000-0000-0000-0000-000000000004'
  const classroom = '00000000-0000-0000-0000-000000000005'
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create schema storage;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema public, auth, storage to authenticated;
      create table public.profiles (id uuid primary key, role text, display_name text);
      create table public.classes (id uuid primary key, teacher_id uuid not null);
      create table public.enrollments (class_id uuid not null, student_id uuid not null);
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (bucket_id text, name text);
      alter table public.profiles enable row level security;
      alter table storage.objects enable row level security;
      grant select on public.profiles to authenticated;
      grant update (display_name) on public.profiles to authenticated;
      grant select, insert, delete on storage.objects to authenticated;
      create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
      create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
      insert into public.profiles values
        ('${teacher}', 'teacher', 'Teacher'), ('${student}', 'student', 'Student'),
        ('${classmate}', 'student', 'Classmate'), ('${outsider}', 'student', 'Outsider');
      insert into public.classes values ('${classroom}', '${teacher}');
      insert into public.enrollments values ('${classroom}', '${student}'), ('${classroom}', '${classmate}');
    `)
    const migration = await readFile(join(__dirname, '..', 'supabase', '10_profile_photos.sql'), 'utf8')
    await db.exec(migration)
    await db.exec(migration)
    await db.exec(`
      update public.profiles set avatar_path = id::text || '/current';
      insert into storage.objects values
        ('profile-photos', '${teacher}/current'),
        ('profile-photos', '${student}/current'),
        ('profile-photos', '${student}/old'),
        ('profile-photos', '${classmate}/current'),
        ('profile-photos', '${outsider}/current');
      set role authenticated;
      select set_config('request.jwt.claim.sub', '${student}', false);
    `)
    const names = async () => (await db.query('select name from storage.objects order by name')).rows.map((row) => row.name)
    assert.deepEqual(await names(), [`${teacher}/current`, `${student}/current`, `${student}/old`, `${classmate}/current`])
    await assert.rejects(db.exec(`insert into storage.objects values ('profile-photos', '${teacher}/new')`), /row-level security/)
    await assert.rejects(db.exec(`update public.profiles set avatar_path = '${teacher}/current' where id = '${student}'`), /check constraint/)
    await db.exec(`insert into storage.objects values ('profile-photos', '${student}/new')`)
    const deleted = await db.query(`delete from storage.objects where name = '${classmate}/current' returning name`)
    assert.equal(deleted.rows.length, 0)
    await db.exec(`select set_config('request.jwt.claim.sub', '${teacher}', false)`)
    assert.deepEqual(await names(), [`${teacher}/current`, `${student}/current`, `${classmate}/current`])
    await db.exec(`select set_config('request.jwt.claim.sub', '${outsider}', false)`)
    assert.deepEqual(await names(), [`${outsider}/current`])
  } finally {
    await db.close()
  }
})
