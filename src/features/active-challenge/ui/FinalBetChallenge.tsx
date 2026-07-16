import { useEffect, useMemo, useState } from "react";
import { ArgentinaFlag, SpainFlag } from "../../../shared/ui/country-flag/flags";
import { CrownIcon } from "../../../shared/ui/icons";
import { getPlayerTotalPoints, saveFinalBet } from "../api";
import type { FinalBet } from "../api";

const BET_DEADLINE = new Date("2026-07-19T20:55:00+02:00").getTime();
const BET_WINDOW_START = new Date("2026-07-16T00:00:00+02:00").getTime();

type FinalBetChallengeProps = {
  initialBet: FinalBet | null;
  onClose?: () => void;
  onSaved: (bet: FinalBet) => void;
  playerToken: string;
};

function formatRemaining(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days > 0 ? `${days}d ` : ""}${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function FinalBetChallenge({ initialBet, onClose, onSaved, playerToken }: FinalBetChallengeProps) {
  const [scoreA, setScoreA] = useState(initialBet ? String(initialBet.predictedScoreA) : "");
  const [scoreB, setScoreB] = useState(initialBet ? String(initialBet.predictedScoreB) : "");
  const [winner, setWinner] = useState<"a" | "b" | null>(initialBet?.predictedWinner ?? null);
  const [betPoints, setBetPoints] = useState(initialBet ? String(initialBet.bet) : "");
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [now, setNow] = useState(BET_WINDOW_START);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getPlayerTotalPoints(playerToken)
      .then(setTotalPoints)
      .catch(() => setError("Nie udało się pobrać Twoich punktów."));
    const updateClock = () => setNow(Date.now());
    const initialClock = window.setTimeout(updateClock, 0);
    const timer = window.setInterval(updateClock, 1000);
    return () => {
      window.clearTimeout(initialClock);
      window.clearInterval(timer);
    };
  }, [playerToken]);

  const maxBet = totalPoints === null ? 0 : Math.floor(totalPoints * .5);
  const isExpired = now >= BET_DEADLINE;
  const progress = useMemo(() => {
    const duration = BET_DEADLINE - BET_WINDOW_START;
    return Math.min(1, Math.max(0, (BET_DEADLINE - now) / duration));
  }, [now]);

  const handleSave = async () => {
    const parsedScoreA = Number(scoreA);
    const parsedScoreB = Number(scoreB);
    const parsedBet = Number(betPoints);

    if (isExpired) return setError("Czas na zmianę predykcji minął.");
    if (!winner) return setError("Wskaż zwycięzcę finału.");
    if (!Number.isInteger(parsedScoreA) || parsedScoreA < 0 || !Number.isInteger(parsedScoreB) || parsedScoreB < 0) {
      return setError("Wpisz poprawny, nieujemny wynik obu drużyn.");
    }
    if (!Number.isInteger(parsedBet) || parsedBet < 1) return setError("Postaw co najmniej 1 punkt.");
    if (parsedBet > maxBet) return setError(`Możesz postawić maksymalnie ${maxBet} pkt.`);

    setIsSaving(true);
    setError("");
    try {
      const saved = await saveFinalBet(playerToken, {
        bet: parsedBet,
        predictedScoreA: parsedScoreA,
        predictedScoreB: parsedScoreB,
        predictedWinner: winner,
      });
      onSaved(saved);
    } catch {
      setError("Nie udało się zapisać predykcji. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="final-bet-step">
      {initialBet && onClose && (
        <button className="final-bet-close" type="button" onClick={onClose} aria-label="Zamknij edycję beta">
          <span aria-hidden="true">×</span>
        </button>
      )}
      <div className="bet-deadline">
        <div className="bet-deadline__meta">
          <span>{isExpired ? "CZAS MINĄŁ" : "CZAS NA ZMIANĘ TYPU"}</span>
          <strong>{isExpired ? "19.07.2026 · 20:55" : formatRemaining(BET_DEADLINE - now)}</strong>
        </div>
        <div className="bet-deadline__track"><span style={{ transform: `scaleX(${progress})` }} /></div>
      </div>

      <header className="final-bet-header">
        <p>GRANDE FINALE · PREDYKCJA</p>
        <h2 id="active-challenge-title">Kto zostanie mistrzem?</h2>
        <span id="active-challenge-description">Wskaż zwycięzcę, przewidź wynik i zdecyduj, ile punktów stawiasz.</span>
      </header>

      <div className="final-matchup">
        <button className={`final-team ${winner === "a" ? "is-winner" : ""}`} type="button" onClick={() => setWinner("a")} disabled={isExpired}>
          {winner === "a" && <CrownIcon className="final-team__crown" />}
          <span className="final-team__flag"><SpainFlag /></span>
          <strong>Hiszpania</strong>
        </button>

        <div className="final-score">
          <input aria-label="Bramki Hiszpanii" inputMode="numeric" min="0" step="1" type="number" value={scoreA} onChange={(event) => setScoreA(event.target.value)} disabled={isExpired} />
          <span>–</span>
          <input aria-label="Bramki Argentyny" inputMode="numeric" min="0" step="1" type="number" value={scoreB} onChange={(event) => setScoreB(event.target.value)} disabled={isExpired} />
        </div>

        <button className={`final-team ${winner === "b" ? "is-winner" : ""}`} type="button" onClick={() => setWinner("b")} disabled={isExpired}>
          {winner === "b" && <CrownIcon className="final-team__crown" />}
          <span className="final-team__flag"><ArgentinaFlag /></span>
          <strong>Argentyna</strong>
        </button>
      </div>

      <div className="bet-submit-row">
        <label>
          <span>STAWKA · MAX {maxBet} PKT</span>
          <input aria-label="Liczba stawianych punktów" inputMode="numeric" min="1" max={maxBet} step="1" type="number" value={betPoints} onChange={(event) => setBetPoints(event.target.value)} disabled={isExpired || totalPoints === null} />
        </label>
        <button type="button" onClick={() => void handleSave()} disabled={isExpired || isSaving || totalPoints === null || maxBet < 1}>
          {isSaving ? "ZAPISUJĘ..." : initialBet ? "ZMIEŃ BET" : "POSTAW"}
        </button>
      </div>
      {error && <p className="final-bet-error" role="alert">{error}</p>}
    </div>
  );
}
