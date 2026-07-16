-- Hotfix dla błędu 42501: permission denied for table players.
-- Nie wykonuj GRANT SELECT ON public.players, bo ujawniłoby tokeny zaproszeń.

create or replace function public.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.players
  where auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_player_id() from public, anon;
grant execute on function public.current_player_id() to authenticated;

drop policy if exists "player can update own profile" on public.players;
create policy "player can update own profile"
on public.players for update
to authenticated
using (id = (select public.current_player_id()))
with check (id = (select public.current_player_id()));

drop policy if exists "player or admin can insert results" on public.results;
create policy "player or admin can insert results"
on public.results for insert
to authenticated
with check (
  (select public.is_current_user_admin())
  or player_id = (select public.current_player_id())
);

drop policy if exists "player or admin can update results" on public.results;
create policy "player or admin can update results"
on public.results for update
to authenticated
using (
  (select public.is_current_user_admin())
  or player_id = (select public.current_player_id())
)
with check (
  (select public.is_current_user_admin())
  or player_id = (select public.current_player_id())
);

drop policy if exists "player or admin can read bets" on public.bets;
create policy "player or admin can read bets"
on public.bets for select
to authenticated
using (
  (select public.is_current_user_admin())
  or player_id = (select public.current_player_id())
);

drop policy if exists "player can insert own bet" on public.bets;
create policy "player can insert own bet"
on public.bets for insert
to authenticated
with check (player_id = (select public.current_player_id()));

drop policy if exists "player can update own bet" on public.bets;
create policy "player can update own bet"
on public.bets for update
to authenticated
using (player_id = (select public.current_player_id()))
with check (player_id = (select public.current_player_id()));
