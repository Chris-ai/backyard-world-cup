import { useLayoutEffect, useRef } from "react";
import type { LeaderboardPlayer } from "../api";
import { useLeaderboard } from "../model";
import { COUNTRIES, CountryFlag } from "../../../shared/ui/country-flag";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { Toast } from "../../../shared/ui/toast";
import "./LeaderboardTable.css";

type LeaderboardTableProps = {
  currentCountry?: CountryCode;
  embedded?: boolean;
};

export function LeaderboardTable({ currentCountry, embedded = false }: LeaderboardTableProps) {
  const { changedCountries, error, isLoading, players, setError } = useLeaderboard();
  const rowRefs = useRef(new Map<CountryCode, HTMLElement>());
  const previousPositions = useRef(new Map<CountryCode, number>());

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
    <section
      className={`leaderboard ${embedded ? "leaderboard--embedded" : ""}`.trim()}
      aria-label={embedded ? "Tabela wyników" : undefined}
      aria-labelledby={embedded ? undefined : "leaderboard-title"}
    >
      {!embedded && (
        <header className="view-navbar leaderboard-navbar">
          <h1 id="leaderboard-title">Tabela wyników</h1>
          <div id="leaderboard-navbar-actions" className="leaderboard-navbar__actions" />
        </header>
      )}

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
