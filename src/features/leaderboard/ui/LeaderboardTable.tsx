import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getLeaderboardPlayers } from "../api";
import type { LeaderboardPlayer } from "../api";
import { COUNTRIES, CountryFlag } from "../../../shared/ui/country-flag";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { Toast } from "../../../shared/ui/toast";
import { supabase } from "../../../utils/supabase";
import "./LeaderboardTable.css";

type LeaderboardTableProps = {
  currentCountry: CountryCode;
};

export function LeaderboardTable({ currentCountry }: LeaderboardTableProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [changedCountries, setChangedCountries] = useState<Set<CountryCode>>(new Set());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const rowRefs = useRef(new Map<CountryCode, HTMLElement>());
  const previousPositions = useRef(new Map<CountryCode, number>());
  const previousPoints = useRef(new Map<CountryCode, number>());
  const hasLoadedPlayers = useRef(false);
  const highlightTimeout = useRef<number | null>(null);

  useEffect(() => {
    let isActive = true;
    let isRefreshInProgress = false;

    const refreshPlayers = async () => {
      if (isRefreshInProgress) return;
      isRefreshInProgress = true;

      try {
        const nextPlayers = await getLeaderboardPlayers();
        if (!isActive) return;

        if (hasLoadedPlayers.current) {
          const changed = new Set(
            nextPlayers
              .filter((player) => previousPoints.current.get(player.country) !== player.points)
              .map((player) => player.country),
          );

          if (changed.size > 0) {
            setChangedCountries(changed);
            if (highlightTimeout.current) window.clearTimeout(highlightTimeout.current);
            highlightTimeout.current = window.setTimeout(() => setChangedCountries(new Set()), 1100);
          }
        }

        previousPoints.current = new Map(
          nextPlayers.map((player) => [player.country, player.points]),
        );
        hasLoadedPlayers.current = true;
        setPlayers(nextPlayers);
        setError("");
      } catch {
        if (isActive) setError("Nie udało się pobrać aktualnej tabeli. Spróbuj ponownie za chwilę.");
      } finally {
        isRefreshInProgress = false;
        if (isActive) setIsLoading(false);
      }
    };

    void refreshPlayers();
    const fallbackRefresh = window.setInterval(() => void refreshPlayers(), 2000);

    const channel = supabase
      .channel("players-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => void refreshPlayers(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => void refreshPlayers(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && isActive) {
          setError("Połączenie realtime zostało przerwane. Odśwież stronę, aby połączyć się ponownie.");
        }
      });

    return () => {
      isActive = false;
      window.clearInterval(fallbackRefresh);
      if (highlightTimeout.current) window.clearTimeout(highlightTimeout.current);
      void supabase.removeChannel(channel);
    };
  }, []);

  useLayoutEffect(() => {
    const nextPositions = new Map<CountryCode, number>();
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    players.forEach((player) => {
      const row = rowRefs.current.get(player.country);
      if (!row) return;

      const nextTop = row.getBoundingClientRect().top;
      const previousTop = previousPositions.current.get(player.country);
      nextPositions.set(player.country, nextTop);

      if (!shouldReduceMotion && previousTop !== undefined) {
        const distance = previousTop - nextTop;
        if (Math.abs(distance) > 1) {
          row.animate(
            [{ transform: `translateY(${distance}px)` }, { transform: "translateY(0)" }],
            { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" },
          );
        }
      }
    });

    previousPositions.current = nextPositions;
  }, [players]);

  const podiumPlayers = players.slice(0, 3);
  const remainingPlayers = players.slice(3);
  const podiumDisplayOrder = [podiumPlayers[1], podiumPlayers[0], podiumPlayers[2]].filter(
    (player): player is LeaderboardPlayer => Boolean(player),
  );

  const setPlayerRef = (country: CountryCode, element: HTMLElement | null) => {
    if (element) rowRefs.current.set(country, element);
    else rowRefs.current.delete(country);
  };

  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <header className="view-navbar leaderboard-navbar">
        <h1 id="leaderboard-title">Tabela wyników</h1>
        <div id="leaderboard-navbar-actions" className="leaderboard-navbar__actions" />
      </header>

      {error && <Toast message={error} type="danger" onClose={() => setError("")} />}

      <div className="leaderboard-content">
        {isLoading && <p className="leaderboard-message">Ładowanie wyników...</p>}

        {!isLoading && players.length === 0 && (
          <p className="leaderboard-message">Nikt jeszcze nie dołączył do gry.</p>
        )}

        {players.length > 0 && (
          <>
            <div className={`podium podium--players-${podiumPlayers.length}`} aria-label="Podium">
              {podiumDisplayOrder.map((player) => {
                const position = players.findIndex((candidate) => candidate.country === player.country) + 1;
                const isCurrentPlayer = player.country === currentCountry;
                const isPointsChanged = changedCountries.has(player.country);

                return (
                  <article
                    className={`podium-entry podium-entry--${position} ${isCurrentPlayer ? "is-current" : ""} ${isPointsChanged ? "points-changed" : ""}`.trim()}
                    key={player.country}
                    ref={(element) => setPlayerRef(player.country, element)}
                  >
                    <div className="podium-player">
                      <CountryFlag country={player.country} />
                      <strong>{player.name}</strong>
                    </div>
                    <div className="podium-column">
                      <span className="podium-position">{position}</span>
                      <strong className="podium-points">{player.points} <small>PKT</small></strong>
                    </div>
                  </article>
                );
              })}
            </div>

            {remainingPlayers.length > 0 && (
              <div className="ranking-list" aria-label="Pozostałe miejsca">
                {remainingPlayers.map((player, index) => {
                  const position = index + 4;
                  const countryDetails = COUNTRIES[player.country];
                  const isCurrentPlayer = player.country === currentCountry;
                  const isPointsChanged = changedCountries.has(player.country);

                  return (
                    <article
                      className={`ranking-row ${isCurrentPlayer ? "is-current" : ""} ${isPointsChanged ? "points-changed" : ""}`.trim()}
                      key={player.country}
                      ref={(element) => setPlayerRef(player.country, element)}
                    >
                      <span className={`rank-number ${isCurrentPlayer ? "rank-number--current" : ""}`.trim()}>{position}</span>
                      <CountryFlag country={player.country} />
                      <div className="ranking-player">
                        <strong>{player.name}</strong>
                        <span>{countryDetails.namePl}</span>
                      </div>
                      <strong className="points">{player.points} <small>PKT</small></strong>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
