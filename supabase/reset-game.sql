-- Reset rozgrywki do stanu początkowego.
-- Uruchom cały plik w Supabase SQL Editor.
--
-- Skrypt:
--   1. usuwa wszystkie wyniki,
--   2. usuwa wszystkie bety,
--   3. zamyka wszystkie challenge'e,
--   4. usuwa imiona uczestników i odpina ich anonimowe sesje Auth,
--   5. zachowuje techniczne rekordy players i tokeny QR potrzebne do dołączenia,
--   6. zachowuje sesję administratora.

begin;

-- Blokujemy tabele na czas resetu, żeby w trakcie operacji nie pojawił się
-- nowy wynik lub bet wysłany przez otwartą aplikację uczestnika.
lock table public.results in access exclusive mode;
lock table public.bets in access exclusive mode;
lock table public.challenges in share row exclusive mode;
lock table public.players in share row exclusive mode;

delete from public.results;
delete from public.bets;

update public.challenges
set status = 'closed'
where status is distinct from 'closed';

-- Rekordów players nie usuwamy, ponieważ zawierają kraje i tokeny QR.
-- Po wyczyszczeniu name gracze znikają z rankingu, a usunięcie auth_user_id
-- pozwala przypisać każdy kubek do nowego urządzenia.
update public.players
set name = null,
    auth_user_id = null
where coalesce("isAdmin", false) = false;

-- Kontrola bezpieczeństwa: jeśli coś nie zostało usunięte, cały reset
-- zostanie wycofany zamiast pozostawić bazę w częściowo wyczyszczonym stanie.
do $$
begin
  if exists (select 1 from public.results) then
    raise exception 'Reset nie powiódł się: tabela results nie jest pusta.';
  end if;

  if exists (select 1 from public.bets) then
    raise exception 'Reset nie powiódł się: tabela bets nie jest pusta.';
  end if;

  if exists (
    select 1
    from public.challenges
    where status is distinct from 'closed'
  ) then
    raise exception 'Reset nie powiódł się: nie wszystkie challenge są zamknięte.';
  end if;

  if exists (
    select 1
    from public.players
    where coalesce("isAdmin", false) = false
      and (name is not null or auth_user_id is not null)
  ) then
    raise exception 'Reset nie powiódł się: nie wszyscy uczestnicy zostali wyzerowani.';
  end if;
end
$$;

commit;

-- Podsumowanie zwracane przez SQL Editor po udanym resecie.
select
  (select count(*) from public.players where coalesce("isAdmin", false) = false) as player_slots_ready,
  (select count(*) from public.players where name is not null and coalesce("isAdmin", false) = false) as joined_players,
  (select count(*) from public.results) as results_remaining,
  (select count(*) from public.bets) as bets_remaining,
  (select count(*) from public.challenges where status = 'closed') as challenges_closed;
