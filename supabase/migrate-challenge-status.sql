-- Zastępuje boolean isOpen statusem sterowanym przez administratora.
alter table public.challenges
  add column if not exists status text;

-- Zachowuje dotychczasowy stan, jeśli kolumna isOpen nadal istnieje.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'challenges'
      and column_name = 'isOpen'
  ) then
    execute $sql$
      update public.challenges
      set status = case when "isOpen" is true then 'open' else 'pending' end
      where status is null
    $sql$;
  end if;
end
$$;

update public.challenges set status = 'pending' where status is null;
update public.challenges set status = 'closed' where status = 'finished';

alter table public.challenges
  alter column status set default 'pending',
  alter column status set not null;

alter table public.challenges
  drop constraint if exists challenges_status_check;

alter table public.challenges
  add constraint challenges_status_check
  check (status in ('pending', 'open', 'closed'));

alter table public.challenges
  drop column if exists "isOpen";
