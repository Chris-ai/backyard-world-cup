-- Jeden wynik gracza na jedną konkurencję jest warunkiem bezpiecznego UPSERT.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'results_player_challenge_unique'
      and conrelid = 'public.results'::regclass
  ) then
    alter table public.results
      add constraint results_player_challenge_unique
      unique (player_token, challange_id);
  end if;
end
$$;

-- Ranking nasłuchuje zmian wyników, a panel także zmian konkurencji.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'results'
  ) then
    alter publication supabase_realtime add table public.results;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'challenges'
  ) then
    alter publication supabase_realtime add table public.challenges;
  end if;
end
$$;
