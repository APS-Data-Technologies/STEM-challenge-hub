-- Daily challenge program: a challenge can be assigned to a day (1-100) and a level.
alter table public.challenges
  add column if not exists program_day smallint
    check (program_day between 1 and 100),
  add column if not exists level text
    check (level in ('Easy', 'Medium', 'Hard'));

alter table public.challenges
  drop constraint if exists daily_day_and_level_together;
alter table public.challenges
  add constraint daily_day_and_level_together check (
    (program_day is null) = (level is null)
  );

create unique index if not exists challenges_daily_slot_idx
  on public.challenges (class_id, program_day, level)
  where program_day is not null;
