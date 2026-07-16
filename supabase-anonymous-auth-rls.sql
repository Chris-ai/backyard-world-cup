-- Uruchom po migracji players.id/auth_user_id oraz results/bets.player_id.
-- Aplikacja korzysta od tej chwili wyłącznie z zalogowanych anonimowo użytkowników.

alter table public.players enable row level security;
alter table public.challenges enable row level security;
alter table public.results enable row level security;
alter table public.bets enable row level security;

-- Usuń szerokie polityki z tymczasowej konfiguracji anon, jeśli zostały utworzone.
drop policy if exists "anon can read challenges" on public.challenges;
drop policy if exists "anon can update challenges" on public.challenges;
drop policy if exists "anon can read players" on public.players;
drop policy if exists "anon can update players" on public.players;
drop policy if exists "anon can read results" on public.results;
drop policy if exists "anon can insert results" on public.results;
drop policy if exists "anon can update results" on public.results;
drop policy if exists "anon can read bets" on public.bets;
drop policy if exists "anon can insert bets" on public.bets;
drop policy if exists "anon can update bets" on public.bets;

-- Niezalogowany klient nie ma bezpośredniego dostępu do tabel.
revoke all on public.players, public.challenges, public.results, public.bets from anon;

-- Uprawnienia tabel i kolumn dla zalogowanych sesji anonimowych.
revoke all on public.players from authenticated;
grant select (id, name, team_name, "isAdmin") on public.players to authenticated;
grant update (name) on public.players to authenticated;

grant select on public.challenges to authenticated;
grant update on public.challenges to authenticated;
grant select, insert, update on public.results to authenticated;
grant select, insert, update on public.bets to authenticated;

-- Indeksy wymagane przez upsert i szybkie polityki.
create unique index if not exists results_player_challenge_key
  on public.results(player_id, challange_id);
create unique index if not exists bets_player_key
  on public.bets(player_id);
create index if not exists players_auth_user_id_idx
  on public.players(auth_user_id);

-- Polityki nie odczytują bezpośrednio ukrytego auth_user_id. Funkcja działa
-- jako właściciel i zwraca wyłącznie UUID gracza bieżącej sesji.
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

-- PLAYERS: ranking jest widoczny dla uczestników, ale token i auth_user_id
-- pozostają niewidoczne dzięki uprawnieniom kolumnowym powyżej.
drop policy if exists "authenticated can read leaderboard players" on public.players;
create policy "authenticated can read leaderboard players"
on public.players for select
to authenticated
using (true);

drop policy if exists "player can update own profile" on public.players;
create policy "player can update own profile"
on public.players for update
to authenticated
using (id = (select public.current_player_id()))
with check (id = (select public.current_player_id()));

-- CHALLENGES: wszyscy widzą stan, tylko admin może go zmieniać.
drop policy if exists "authenticated can read challenges" on public.challenges;
create policy "authenticated can read challenges"
on public.challenges for select
to authenticated
using (true);

drop policy if exists "admin can update challenges" on public.challenges;
create policy "admin can update challenges"
on public.challenges for update
to authenticated
using ((select public.is_current_user_admin()))
with check ((select public.is_current_user_admin()));

-- RESULTS: ranking jest wspólny; gracz zapisuje tylko swój rekord, admin każdy.
drop policy if exists "authenticated can read results" on public.results;
create policy "authenticated can read results"
on public.results for select
to authenticated
using (true);

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

-- BETS: gracz widzi i modyfikuje swój bet; admin widzi wszystkie.
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
with check (
  player_id = (select public.current_player_id())
);

drop policy if exists "player can update own bet" on public.bets;
create policy "player can update own bet"
on public.bets for update
to authenticated
using (
  player_id = (select public.current_player_id())
)
with check (
  player_id = (select public.current_player_id())
);

-- Funkcje dostępne tylko po uzyskaniu anonimowej sesji Auth.
revoke all on function public.claim_player(text) from public, anon;
grant execute on function public.claim_player(text) to authenticated;
revoke all on function public.is_current_user_admin() from public, anon;
grant execute on function public.is_current_user_admin() to authenticated;
