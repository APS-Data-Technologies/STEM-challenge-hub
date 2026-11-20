const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFile } = require('node:fs/promises')
const { join } = require('node:path')
const { PGlite } = require('@electric-sql/pglite')

test('daily programs enforce scheduling, progress, and classroom access', async () => {
  const db = new PGlite()
  const teacher = '00000000-0000-0000-0000-000000000001'
  const student = '00000000-0000-0000-0000-000000000002'
  const outsider = '00000000-0000-0000-0000-000000000003'
  const classId = '00000000-0000-0000-0000-000000000004'
  const programId = '00000000-0000-0000-0000-000000000005'
  const q1 = '00000000-0000-0000-0000-000000000006'
  const q2 = '00000000-0000-0000-0000-000000000007'
  const q3 = '00000000-0000-0000-0000-000000000008'
  const lateProgram = '00000000-0000-0000-0000-000000000009'
  const lateQuestion = '00000000-0000-0000-0000-000000000010'

  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
      alter default privileges in schema public grant all on tables to authenticated;
      create table public.profiles (id uuid primary key);
      create table public.classes (id uuid primary key, teacher_id uuid not null);
      create table public.enrollments (class_id uuid not null, student_id uuid not null);
      create function public.is_class_teacher(p_class_id uuid)
      returns boolean language sql stable security definer set search_path = '' as $$
        select exists (select 1 from public.classes c
          where c.id = p_class_id and c.teacher_id = auth.uid())
      $$;
      create function public.is_enrolled(p_class_id uuid)
      returns boolean language sql stable security definer set search_path = '' as $$
        select exists (select 1 from public.enrollments e
          where e.class_id = p_class_id and e.student_id = auth.uid())
      $$;
      insert into public.profiles values ('${teacher}'), ('${student}'), ('${outsider}');
      insert into public.classes values ('${classId}', '${teacher}');
      insert into public.enrollments values ('${classId}', '${student}');
    `)
    await db.exec(await readFile(join(__dirname, '..', 'supabase', '09_daily_programs.sql'), 'utf8'))
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${teacher}', false)`)
    await assert.rejects(db.exec(`
      insert into public.daily_programs
        (class_id, title, subject, grade_band, days, start_date, start_time, time_zone, easy_count, medium_count, hard_count)
      values ('${classId}', 'Invalid', 'Math', 'K-2', 1, current_date, '00:00', 'Invalid/Zone', 1, 0, 0)
    `), /valid time zone/)
    await db.exec(`
      insert into public.daily_programs
        (id, class_id, title, subject, grade_band, days, start_date, start_time, time_zone, easy_count, medium_count, hard_count)
      values ('${programId}', '${classId}', 'Daily', 'Math', 'K-2', 2,
        (now() at time zone 'UTC')::date, '00:00', 'UTC', 2, 1, 0);
    `)
    await assert.rejects(db.exec(`
      insert into public.daily_program_questions
        (program_id, day_number, position, level, title, prompt, answer_type)
      values ('${programId}', 1, 1, 'Easy', 'Invalid', 'Question?', 'multiple_choice')
    `), /array of choices/)
    await assert.rejects(db.exec(`
      insert into public.daily_program_questions
        (program_id, day_number, position, level, title, prompt, answer_type, choices)
      values ('${programId}', 1, 1, 'Easy', 'Invalid', 'Question?', 'multiple_choice', '["A","a"]')
    `), /nonempty and unique/)
    await assert.rejects(db.exec(`update public.daily_programs set is_published = true where id = '${programId}'`), /Every day/)
    await assert.rejects(db.exec(`
      insert into public.daily_program_questions
        (program_id, day_number, position, level, title, prompt, answer_type)
      values ('${programId}', 1, 11, 'Easy', 'Invalid', 'Question?', 'short_answer')
    `), /check constraint/)
    await db.exec(`
      insert into public.daily_program_questions
        (id, program_id, day_number, position, level, title, prompt, answer_type, choices)
      values
        ('${q1}', '${programId}', 1, 1, 'Easy', 'One', 'First?', 'multiple_choice', '["A","B"]'),
        ('${q2}', '${programId}', 1, 2, 'Easy', 'Two', 'Second?', 'short_answer', null),
        ('${q3}', '${programId}', 2, 1, 'Medium', 'Three', 'Third?', 'short_answer', null);
    `)
    await assert.rejects(db.exec(`update public.daily_programs set is_published = true where id = '${programId}'`), /correct answer/)
    await db.exec(`
      insert into public.daily_program_keys values ('${q1}', 'A');
      update public.daily_programs set is_published = true where id = '${programId}';
    `)
    await assert.rejects(db.exec(`update public.daily_program_questions set prompt = 'Changed' where id = '${q1}'`), /Unpublish/)
    await db.exec(`select set_config('request.jwt.claim.sub', '${student}', false)`)
    const visible = await db.query(`select id from public.daily_program_questions order by position`)
    assert.deepEqual(visible.rows.map((row) => row.id), [q1, q2])
    assert.equal((await db.query('select * from public.daily_program_keys')).rows.length, 0)
    await assert.rejects(db.query(`select public.submit_daily_program_answer('${q3}', 'early')`), /not available/)
    await assert.rejects(db.query(`select public.submit_daily_program_answer('${q1}', 'not a choice')`), /available answers/)
    assert.equal((await db.query(`select public.submit_daily_program_answer('${q1}', 'A') as correct`)).rows[0].correct, true)
    let progress = (await db.query(`select public.get_daily_program_progress('${programId}', '${student}') as progress`)).rows[0].progress
    assert.equal(progress.answered_questions, 1)
    assert.equal(progress.current_streak, 0)
    await db.query(`select public.submit_daily_program_answer('${q2}', 'my answer')`)
    progress = (await db.query(`select public.get_daily_program_progress('${programId}', '${student}') as progress`)).rows[0].progress
    assert.equal(progress.answered_questions, 2)
    assert.equal(progress.completed_days, 1)
    assert.equal(progress.current_streak, 1)
    const firstSubmitted = (await db.query(`select first_submitted_at from public.daily_program_answers where question_id = '${q1}'`)).rows[0].first_submitted_at
    await db.query(`select public.submit_daily_program_answer('${q1}', 'B')`)
    assert.deepEqual((await db.query(`select first_submitted_at from public.daily_program_answers where question_id = '${q1}'`)).rows[0].first_submitted_at, firstSubmitted)
    await assert.rejects(db.exec(`insert into public.daily_program_answers (question_id, student_id, answer) values ('${q3}', '${student}', 'x')`), /permission denied/)
    await db.exec(`select set_config('request.jwt.claim.sub', '${outsider}', false)`)
    assert.equal((await db.query('select * from public.daily_program_questions')).rows.length, 0)
    await assert.rejects(db.query(`select public.get_daily_program_progress('${programId}', '${student}')`), /not available/)
    await db.exec(`select set_config('request.jwt.claim.sub', '${teacher}', false)`)
    progress = (await db.query(`select public.get_daily_program_progress('${programId}', '${student}') as progress`)).rows[0].progress
    assert.equal(progress.current_streak, 1)
    await assert.rejects(db.exec(`update public.daily_programs set is_published = false where id = '${programId}'`), /cannot be changed/)
    const answerId = (await db.query(`select id from public.daily_program_answers where question_id = '${q2}'`)).rows[0].id
    await db.query(`select public.review_daily_program_answer('${answerId}', true)`)
    assert.equal((await db.query(`select is_correct from public.daily_program_answers where id = '${answerId}'`)).rows[0].is_correct, true)

    await db.exec(`
      insert into public.daily_programs
        (id, class_id, title, subject, grade_band, days, start_date, start_time, time_zone, easy_count, medium_count, hard_count)
      values ('${lateProgram}', '${classId}', 'Late', 'Math', 'K-2', 1,
        (now() at time zone 'UTC')::date - 1, '00:00', 'UTC', 1, 0, 0);
      insert into public.daily_program_questions
        (id, program_id, day_number, position, level, title, prompt, answer_type)
      values ('${lateQuestion}', '${lateProgram}', 1, 1, 'Easy', 'Late', 'Answer?', 'short_answer');
      update public.daily_programs set is_published = true where id = '${lateProgram}';
      select set_config('request.jwt.claim.sub', '${student}', false);
      select public.submit_daily_program_answer('${lateQuestion}', 'late');
    `)
    progress = (await db.query(`select public.get_daily_program_progress('${lateProgram}', '${student}') as progress`)).rows[0].progress
    assert.equal(progress.answered_questions, 1)
    assert.equal(progress.completed_days, 0)
    assert.equal(progress.current_streak, 0)
    const dst = await db.query(`
      select public.daily_program_opens_at('2026-03-07', '10:00', 'America/Chicago', 1) as first,
             public.daily_program_opens_at('2026-03-07', '10:00', 'America/Chicago', 2) as second
    `)
    assert.equal(dst.rows[0].first.toISOString(), '2026-03-07T16:00:00.000Z')
    assert.equal(dst.rows[0].second.toISOString(), '2026-03-08T15:00:00.000Z')
    await db.exec(`reset role; delete from public.classes where id = '${classId}'`)
    assert.equal((await db.query('select count(*)::int as count from public.daily_programs')).rows[0].count, 0)
  } finally {
    await db.close()
  }
})
