import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminDashboardData,
  saveChallengeScores,
  setChallengeStatus,
} from "../../../features/admin/api";
import type {
  AdminDashboardData,
  ChallengeStatus,
} from "../../../features/admin/api";
import { COUNTRIES, CountryFlag } from "../../../shared/ui/country-flag";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { Toast } from "../../../shared/ui/toast";
import { LeaderboardIcon } from "../../../shared/ui/icons";
import { supabase } from "../../../utils/supabase";
import { FinalBetAdminEditor } from "./FinalBetAdminEditor";
import { AdminLeaderboardDrawer } from "./AdminLeaderboardDrawer";
import "./AdminPage.css";

function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES;
}

export function AdminPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(
    null,
  );
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingChallengeId, setTogglingChallengeId] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const nextDashboard = await getAdminDashboardData();
      setDashboard(nextDashboard);
      setError("");
    } catch {
      setError("Nie udało się pobrać danych panelu administratora.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadDashboard(), 0);

    const channel = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => void loadDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        () => void loadDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => void loadDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bets" },
        () => void loadDashboard(),
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialLoad);
      void supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const activeChallenge = useMemo(
    () =>
      dashboard?.challenges.find(
        (challenge) => challenge.id === activeChallengeId,
      ) ?? null,
    [activeChallengeId, dashboard?.challenges],
  );

  const toggleChallenge = (challengeId: string) => {
    if (!dashboard) return;

    if (activeChallengeId === challengeId) {
      setActiveChallengeId(null);
      setDraftScores({});
      return;
    }

    const scoresByPlayer = new Map(
      dashboard.results
        .filter((result) => result.challengeId === challengeId)
        .map((result) => [result.playerId, result.score]),
    );

    setDraftScores(
      Object.fromEntries(
        dashboard.players.map((player) => [
          player.id,
          String(scoresByPlayer.get(player.id) ?? 0),
        ]),
      ),
    );
    setActiveChallengeId(challengeId);
    setSuccessMessage("");
    setError("");
  };

  const handleSave = async (
    providedScores?: Array<{ playerId: string; score: number }>,
  ) => {
    if (!dashboard || !activeChallengeId) return;

    const scores =
      providedScores ??
      dashboard.players.map((player) => ({
        playerId: player.id,
        score: Number(draftScores[player.id] || 0),
      }));

    if (scores.some(({ score }) => !Number.isFinite(score))) {
      setError("Każdy wynik musi być poprawną liczbą.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await saveChallengeScores(activeChallengeId, scores);
      await loadDashboard();
      setSuccessMessage("Wszystkie punkty zostały zapisane.");
    } catch {
      setError(
        "Nie udało się zapisać punktów. Sprawdź konfigurację tabeli results.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isGrandeFinale =
    activeChallenge?.name.toLocaleLowerCase("pl") === "grande finale";

  const handleChallengeState = async (nextStatus: ChallengeStatus) => {
    if (!activeChallenge || activeChallenge.status === nextStatus) return;
    setTogglingChallengeId(activeChallenge.id);
    setError("");
    setSuccessMessage("");

    try {
      await setChallengeStatus(activeChallenge.id, nextStatus);
      await loadDashboard();
      setSuccessMessage(
        nextStatus === "open"
          ? `Uruchomiono: ${activeChallenge.name}.`
          : nextStatus === "pending"
            ? `Rozpoczęto zadanie: ${activeChallenge.name}.`
            : `Zamknięto: ${activeChallenge.name}.`,
      );
    } catch {
      setError("Nie udało się zmienić stanu konkurencji.");
    } finally {
      setTogglingChallengeId(null);
    }
  };

  return (
    <section className="admin-screen" aria-labelledby="admin-title">
      <header className="view-navbar admin-navbar">
        <h1 id="admin-title">Gospodarz</h1>
        <div className="admin-navbar__actions">
          <button type="button" onClick={() => setIsLeaderboardOpen(true)} aria-label="Pokaż tabelę wyników">
            <LeaderboardIcon />
          </button>
        </div>
      </header>

      {isLeaderboardOpen && <AdminLeaderboardDrawer onClose={() => setIsLeaderboardOpen(false)} />}

      {error && (
        <Toast message={error} type="danger" onClose={() => setError("")} />
      )}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage("")}
        />
      )}

      <div className="admin-page">
        {isLoading && (
          <div className="admin-loading" aria-label="Ładowanie konkurencji" />
        )}

        {dashboard && (
          <>
            <div className="challenge-grid" aria-label="Lista konkurencji">
              {dashboard.challenges.map((challenge, index) => {
                const isActive = challenge.id === activeChallengeId;
                return (
                  <button
                    className={`challenge-tile ${isActive ? "challenge-tile--active" : ""} challenge-tile--${challenge.status}`.trim()}
                    key={challenge.id}
                    type="button"
                    onClick={() => toggleChallenge(challenge.id)}
                    aria-expanded={isActive}
                    aria-controls="challenge-results"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{challenge.name}</strong>
                    <small>
                      {challenge.status === "open"
                        ? "AKTYWNE"
                        : challenge.status === "pending"
                          ? "W TRAKCIE"
                          : challenge.status === "closed"
                            ? "ZAMKNIĘTE"
                            : challenge.type.toUpperCase()}
                    </small>
                    <i aria-hidden="true">{isActive ? "−" : "+"}</i>
                  </button>
                );
              })}
            </div>

            {activeChallenge && (
              <div className="challenge-editor" id="challenge-results">
                <div className="challenge-editor__heading">
                  <div>
                    <p>EDYCJA PUNKTÓW</p>
                    <h2>{activeChallenge.name}</h2>
                  </div>
                  <div className="challenge-editor__actions">
                    {activeChallenge.type === "online" && (
                      <>
                        {activeChallenge.status !== "open" && (
                          <button
                            className="button-start"
                            type="button"
                            onClick={() => void handleChallengeState("open")}
                            disabled={
                              togglingChallengeId === activeChallenge.id
                            }
                          >
                            {togglingChallengeId === activeChallenge.id
                              ? "ZMIENIAM..."
                              : "OTWÓRZ CHALLENGE"}
                          </button>
                        )}
                        {activeChallenge.status !== "pending" && (
                          <button
                            className="button-pending"
                            type="button"
                            onClick={() => void handleChallengeState("pending")}
                            disabled={
                              togglingChallengeId === activeChallenge.id
                            }
                          >
                            ROZPOCZNIJ ZADANIE
                          </button>
                        )}
                        {activeChallenge.status !== "closed" && (
                          <button
                            className="button-stop"
                            type="button"
                            onClick={() => void handleChallengeState("closed")}
                            disabled={
                              togglingChallengeId === activeChallenge.id
                            }
                          >
                            ZAMKNIJ CHALLENGE
                          </button>
                        )}
                      </>
                    )}
                    {!isGrandeFinale && (
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isSaving}
                      >
                        {isSaving ? "ZAPISUJĘ..." : "ZAPISZ WSZYSTKIE PUNKTY"}
                      </button>
                    )}
                  </div>
                </div>

                {isGrandeFinale ? (
                  <FinalBetAdminEditor
                    bets={dashboard.bets}
                    isSaving={isSaving}
                    key={dashboard.bets
                      .map(
                        (bet) =>
                          `${bet.playerId}:${bet.predictedScoreA}:${bet.predictedScoreB}:${bet.predictedWinner}:${bet.bet}`,
                      )
                      .join("|")}
                    onError={setError}
                    onSave={handleSave}
                    players={dashboard.players}
                  />
                ) : (
                  <div className="admin-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>GRACZ</th>
                          <th>KRAJ</th>
                          <th>PUNKTY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.players.map((player) => {
                          const country = isCountryCode(player.teamName)
                            ? player.teamName
                            : null;
                          return (
                            <tr
                              className={
                                !player.name ? "is-pending" : undefined
                              }
                              key={player.id}
                            >
                              <td>
                                <strong>
                                  {player.name ?? "Jeszcze nie dołączył"}
                                </strong>
                              </td>
                              <td>
                                <div className="admin-team">
                                  {country && <CountryFlag country={country} />}
                                  <span>
                                    {country
                                      ? COUNTRIES[country].namePl
                                      : player.teamName}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <input
                                  aria-label={`Punkty: ${player.name ?? player.teamName}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={draftScores[player.id] ?? "0"}
                                  onChange={(event) =>
                                    setDraftScores((current) => ({
                                      ...current,
                                      [player.id]: event.target.value,
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
