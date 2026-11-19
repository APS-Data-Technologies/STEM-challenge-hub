-- Store each class's teaching band so it remains grouped correctly after renaming.
alter table public.classes
  add column if not exists grade_band text
    check (grade_band in ('K-5', '6-8', '9-12'));

update public.classes
set grade_band = case
  when name ~* 'kindergarten|grade[[:space:]]+(k|[1-5](st|nd|rd|th)?|one|two|three|four|five)([^a-z0-9]|$)' then 'K-5'
  when name ~* 'grade[[:space:]]+([6-8](st|nd|rd|th)?|six|seven|eight)([^a-z0-9]|$)' then '6-8'
  when name ~* 'grade[[:space:]]+(9(st|nd|rd|th)?|1[0-2](st|nd|rd|th)?|nine|ten|eleven|twelve)([^a-z0-9]|$)' then '9-12'
  else grade_band
end
where grade_band is null;
