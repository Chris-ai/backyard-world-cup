import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminDashboardData, saveChallengeScores, setChallengeStatus } from "../../../features/admin/api";
import type { AdminDashboardData, PlayerScore } from "../../../features/admin/model";
import type { ChallengeStatus } from "../../../shared/model/challenge";
import { LeaderboardIcon } from "../../../shared/ui/icons";
import { Toast } from "../../../shared/ui/toast";
import { supabase } from "../../../utils/supabase";
import { AdminChallengeEditor } from "./AdminChallengeEditor";
import { AdminChallengeGrid } from "./AdminChallengeGrid";
import { AdminLeaderboardDrawer } from "./AdminLeaderboardDrawer";
import "./AdminPage.css";

export function AdminPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingChallengeId, setTogglingChallengeId] = useState<string | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(await getAdminDashboardData());
      setError("");
    } catch {
      setError("Nie udało się pobrać danych panelu administratora.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadDashboard(), 0);
    const fallbackRefresh = window.setInterval(() => void loadDashboard(), 2000);
    const refresh = () => void loadDashboard();
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "bets" }, refresh)
      .subscribe();

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(fallbackRefresh);
      void supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const activeChallenge = useMemo(
    () => dashboard?.challenges.find((challenge) => challenge.id === activeChallengeId) ?? null,
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
    setDraftScores(Object.fromEntries(
      dashboard.players.map((player) => [player.id, String(scoresByPlayer.get(player.id) ?? 0)]),
    ));
    setActiveChallengeId(challengeId);
    setSuccessMessage("");
    setError("");
  };

  const handleSave = async (providedScores?: PlayerScore[]) => {
    if (!dashboard || !activeChallengeId) return;
    const scores = providedScores ?? dashboard.players.map((player) => ({
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
      setError("Nie udało się zapisać punktów. Sprawdź konfigurację tabeli results.");
    } finally {
      setIsSaving(false);
    }
  };

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
      {error && <Toast message={error} type="danger" onClose={() => setError("")} />}
      {successMessage && <Toast message={successMessage} type="success" onClose={() => setSuccessMessage("")} />}

      <div className="admin-page">
        {isLoading && <div className="admin-loading" aria-label="Ładowanie konkurencji" />}
        {dashboard && (
          <>
            <AdminChallengeGrid activeChallengeId={activeChallengeId} challenges={dashboard.challenges} onToggle={toggleChallenge} />
            {activeChallenge && (
              <AdminChallengeEditor
                bets={dashboard.bets}
                challenge={activeChallenge}
                draftScores={draftScores}
                isSaving={isSaving}
                isTogglingStatus={togglingChallengeId === activeChallenge.id}
                onError={setError}
                onSave={handleSave}
                onScoreChange={(playerId, score) => setDraftScores((current) => ({ ...current, [playerId]: score }))}
                onStatusChange={handleChallengeState}
                players={dashboard.players}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
