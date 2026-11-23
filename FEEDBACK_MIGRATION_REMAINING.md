# Challenge Feedback System - Remaining Migration Steps

## Status
✅ **Step 1 Completed:** ALTER TABLE to add `feedback_enabled` column
❌ **Steps 2-5: PENDING** - Browser UI issues preventing execution

## Problem
The Supabase SQL Editor's Monaco editor has a persistent UI blocker where the editor's view-lines div intercepts pointer events, preventing clicks on the Run button. This requires the remaining migration steps to be executed manually or via alternative method.

## Remaining Steps to Execute

All the following SQL statements should be executed in the Supabase SQL Editor (or via your CLI if available).

### Step 2: Create the challenge_feedback table

```sql
create table public.challenge_feedback (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  clarity text check (clarity in ('clear', 'somewhat', 'confusing')),
  enjoyment text check (enjoyment in ('loved', 'liked', 'okay', 'struggled')),
  comment text check (length(comment) <= 500),
  submitted_at timestamptz not null default now(),
  constraint one_feedback_per_student unique (challenge_id, student_id)
);
```

### Step 3: Create indexes

```sql
create index challenge_feedback_challenge_idx on public.challenge_feedback(challenge_id);
create index challenge_feedback_student_idx on public.challenge_feedback(student_id);
```

### Step 4: Create RLS (Row Level Security) policies

```sql
-- Policy 1: Students can insert feedback for their own class's challenges
create policy "feedback: students submit for own classes"
  on public.challenge_feedback
  for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.challenges c
      join public.class_challenges cc on c.id = cc.challenge_id
      where c.id = challenge_id
        and c.feedback_enabled = true
        and cc.class_id in (
          select class_id from public.student_enrollments
          where student_id = auth.uid()
        )
    )
  );

-- Policy 2: Students can update their own feedback
create policy "feedback: students update own"
  on public.challenge_feedback
  for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- Policy 3: Teachers can read feedback for challenges in their classes
create policy "feedback: teachers read own classes"
  on public.challenge_feedback
  for select
  using (
    exists (
      select 1 from public.challenges c
      join public.class_challenges cc on c.id = cc.challenge_id
      where c.id = challenge_id
        and cc.class_id in (
          select id from public.classes
          where teacher_id = auth.uid()
        )
    )
  );

-- Policy 4: Teachers can enable/disable feedback on challenges in their classes
create policy "challenges: teachers enable feedback"
  on public.challenges
  for update
  using (
    exists (
      select 1 from public.classes
      where id in (
        select class_id from public.class_challenges
        where challenge_id = id
      )
      and teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes
      where id in (
        select class_id from public.class_challenges
        where challenge_id = id
      )
      and teacher_id = auth.uid()
    )
  );
```

### Step 5: Enable Row Level Security

```sql
alter table public.challenge_feedback enable row level security;
```

### Step 6 (Optional): Enable feedback on existing published challenges

```sql
update public.challenges
set feedback_enabled = true
where id in (
  select challenge_id from public.class_challenges
);
```

## How to Execute

### Option A: Supabase Web UI (Browser)
1. Go to https://supabase.com/dashboard/project/ktfvekxearaiepcqlhao/sql
2. Create a new query tab
3. Copy and paste **ONE** of the SQL statements above
4. Click the "Run" button (or try Ctrl+Enter)
5. Wait for "Success. No rows returned" message
6. Repeat for each step

**Note:** If you encounter the pointer event blocking issue:
- Try collapsing the left sidebar
- Or use keyboard shortcut: Ctrl+Enter (might work if clicking doesn't)
- Or try a different browser/incognito mode

### Option B: Supabase CLI (Recommended if available)
If you have the Supabase CLI installed:
```bash
supabase db push
```
This will execute all remaining migrations from the `supabase/migrations/` directory.

### Option C: PostgreSQL Client
Using psql or any PostgreSQL client:
```bash
psql -d postgresql://postgres:[password]@[host]:6543/postgres -c "$(cat file.sql)"
```

## Expected Results

After all steps are completed:
1. `challenge_feedback` table exists with all columns
2. Indexes created for performance
3. RLS policies enabled (security enforced)
4. Students can submit feedback in the app
5. Teachers can read feedback for their classes

## Testing

Once migrations complete:
1. Open the app: http://localhost:5173
2. Log in as a student
3. Open a challenge
4. Click "Send Feedback" button
5. Submit feedback
6. Should see "Feedback submitted successfully!"

## Git Status

Files modified:
- ✅ `src/App.tsx` - Fixed feedback submission handler
- ✅ `src/components/ChallengeForm.tsx` - Changed default `feedback_enabled` to true
- ✅ `supabase/migrations/12_challenge_feedback.sql` - Already contains the full migration

Uncommitted changes:
- Run `git status` to see file changes
- Run `git add .` && `git commit -m "Execute challenge feedback migration steps"` after migrations complete

## References

- Challenge feedback migration file: `supabase/migrations/12_challenge_feedback.sql`
- Main code changes: `src/App.tsx` (line 2762-2795)
- Form default: `src/components/ChallengeForm.tsx` (line 61)
