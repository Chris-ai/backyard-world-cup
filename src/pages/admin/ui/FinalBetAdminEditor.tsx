import { useMemo, useState } from "react";
import type { AdminBet, AdminPlayer } from "../../../features/admin/api";
import { ArgentinaFlag, SpainFlag } from "../../../shared/ui/country-flag/flags";
import { COUNTRIES, CountryFlag, isCountryCode } from "../../../shared/ui/country-flag";

type FinalBetAdminEditorProps = {
  bets: AdminBet[];
  isSaving: boolean;
  onError: (message: string) => void;
  onSave: (scores: Array<{ playerId: string; score: number }>) => Promise<void>;
  players: AdminPlayer[];
};

export function FinalBetAdminEditor({ bets, isSaving, onError, onSave, players }: FinalBetAdminEditorProps) {
  const [winner, setWinner] = useState<"a" | "b" | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [calculatedScores, setCalculatedScores] = useState<Record<string, number> | null>(null);

  const playerByToken = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );

  const calculate = () => {
    const parsedScoreA = Number(scoreA);
    const parsedScoreB = Number(scoreB);
    if (!winner) return onError("Wskaż zwycięzcę finału.");
    if (!Number.isInteger(parsedScoreA) || parsedScoreA < 0 || !Number.isInteger(parsedScoreB) || parsedScoreB < 0) {
      return onError("Wpisz poprawny, nieujemny wynik finału.");
    }

    setCalculatedScores(Object.fromEntries(bets.map((bet) => {
      const winnerPoints = bet.predictedWinner === winner ? bet.bet : -bet.bet;
      const exactScorePoints = bet.predictedScoreA === parsedScoreA && bet.predictedScoreB === parsedScoreB ? 5 : 0;
      return [bet.playerId, winnerPoints + exactScorePoints];
    })));
    onError("");
  };

  return (
    <>
      <div className="final-admin-settlement">
        <div className="final-admin-result">
          <button className={winner === "a" ? "is-selected" : ""} type="button" onClick={() => { setWinner("a"); setCalculatedScores(null); }}>
            <SpainFlag /><strong>Hiszpania</strong>
          </button>
          <input aria-label="Bramki Hiszpanii" type="number" min="0" step="1" value={scoreA} onChange={(event) => { setScoreA(event.target.value); setCalculatedScores(null); }} />
          <span>–</span>
          <input aria-label="Bramki Argentyny" type="number" min="0" step="1" value={scoreB} onChange={(event) => { setScoreB(event.target.value); setCalculatedScores(null); }} />
          <button className={winner === "b" ? "is-selected" : ""} type="button" onClick={() => { setWinner("b"); setCalculatedScores(null); }}>
            <ArgentinaFlag /><strong>Argentyna</strong>
          </button>
        </div>
        <div className="final-admin-settlement__actions">
          <button className="button-calculate" type="button" onClick={calculate}>PRZELICZ PUNKTY</button>
          <button type="button" disabled={!calculatedScores || isSaving} onClick={() => calculatedScores && void onSave(bets.map((bet) => ({ playerId: bet.playerId, score: calculatedScores[bet.playerId] ?? 0 })))}>
            {isSaving ? "ZAPISUJĘ..." : "ZAPISZ WSZYSTKIE PUNKTY"}
          </button>
        </div>
      </div>

      <div className="admin-table-scroll">
        <table className="final-bets-table">
          <thead><tr><th>GRACZ</th><th>KRAJ</th><th>TYP</th><th>STAWKA</th><th>PUNKTY</th></tr></thead>
          <tbody>
            {bets.length === 0 && <tr><td className="final-bets-empty" colSpan={5}>Nikt jeszcze nie postawił beta.</td></tr>}
            {bets.map((bet) => {
              const player = playerByToken.get(bet.playerId);
              const country = player && isCountryCode(player.teamName) ? player.teamName : null;
              const calculatedScore = calculatedScores?.[bet.playerId];
              const scoreClassName = calculatedScore === undefined
                ? "calculated-score is-empty"
                : calculatedScore < 0
                  ? "calculated-score is-negative"
                  : calculatedScore === 0
                    ? "calculated-score is-zero"
                    : "calculated-score";
              return (
                <tr key={bet.playerId}>
                  <td><strong>{player?.name ?? "Nieznany gracz"}</strong></td>
                  <td><div className="admin-team">{country && <CountryFlag country={country} />}<span>{country ? COUNTRIES[country].namePl : player?.teamName ?? "—"}</span></div></td>
                  <td><div className="admin-bet-prediction">{bet.predictedWinner === "a" ? <SpainFlag /> : <ArgentinaFlag />}<strong>{bet.predictedScoreA}–{bet.predictedScoreB}</strong></div></td>
                  <td><strong>{bet.bet} PKT</strong></td>
                  <td><strong className={scoreClassName}>{calculatedScore === undefined ? "—" : `${calculatedScore} PKT`}</strong></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
