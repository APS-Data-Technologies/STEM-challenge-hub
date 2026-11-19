-- Teacher-authored class announcements, descriptions, rules, and guidelines.
alter table public.classes
  add column if not exists message_type text
    check (message_type in ('Announcement', 'Description', 'Rules', 'Guidelines')),
  add column if not exists message_heading text
    check (length(message_heading) <= 100),
  add column if not exists message_content text
    check (length(message_content) <= 2000);
