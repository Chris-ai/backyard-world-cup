import type { AdminBet, AdminChallenge, AdminPlayer, PlayerScore } from "../../../features/admin/model";
import type { ChallengeStatus } from "../../../shared/model/challenge";
import { CHALLENGE_NAMES, normalizeChallengeName } from "../../../shared/model/challenge";
import { AdminPlayersScoresTable } from "./AdminPlayersScoresTable";
import { FinalBetAdminEditor } from "./FinalBetAdminEditor";

type AdminChallengeEditorProps = {
  bets: AdminBet[];
  challenge: AdminChallenge;
  draftScores: Record<string, string>;
  isSaving: boolean;
  isTogglingStatus: boolean;
  onError: (message: string) => void;
  onSave: (scores?: PlayerScore[]) => Promise<void>;
  onScoreChange: (playerId: string, score: string) => void;
  onStatusChange: (status: ChallengeStatus) => Promise<void>;
  players: AdminPlayer[];
};

function ChallengeStatusActions({ challenge, isToggling, onChange }: {
  challenge: AdminChallenge;
  isToggling: boolean;
  onChange: (status: ChallengeStatus) => Promise<void>;
}) {
  if (challenge.type !== "online") return null;
  return (
    <>
      {challenge.status === "closed" && (
        <button className="button-start" type="button" onClick={() => void onChange("open")} disabled={isToggling}>
          {isToggling ? "ZMIENIAM..." : "OTWÓRZ CHALLENGE"}
        </button>
      )}
      {challenge.status === "open" && (
        <button className="button-pending" type="button" onClick={() => void onChange("pending")} disabled={isToggling}>
          ROZPOCZNIJ ZADANIE
        </button>
      )}
      {challenge.status !== "closed" && (
        <button className="button-stop" type="button" onClick={() => void onChange("closed")} disabled={isToggling}>
          ZAMKNIJ CHALLENGE
        </button>
      )}
    </>
  );
}

export function AdminChallengeEditor(props: AdminChallengeEditorProps) {
  const { bets, challenge, draftScores, isSaving, isTogglingStatus, onError, onSave, onScoreChange, onStatusChange, players } = props;
  const isGrandeFinale = normalizeChallengeName(challenge.name) === CHALLENGE_NAMES.grandeFinale;

  return (
    <div className="challenge-editor" id="challenge-results">
      <div className="challenge-editor__heading">
        <div><p>EDYCJA PUNKTÓW</p><h2>{challenge.name}</h2></div>
        <div className="challenge-editor__actions">
          <ChallengeStatusActions challenge={challenge} isToggling={isTogglingStatus} onChange={onStatusChange} />
          {!isGrandeFinale && (
            <button type="button" onClick={() => void onSave()} disabled={isSaving}>
              {isSaving ? "ZAPISUJĘ..." : "ZAPISZ WSZYSTKIE PUNKTY"}
            </button>
          )}
        </div>
      </div>

      {isGrandeFinale ? (
        <FinalBetAdminEditor
          bets={bets}
          isSaving={isSaving}
          key={bets.map((bet) => `${bet.playerId}:${bet.predictedScoreA}:${bet.predictedScoreB}:${bet.predictedWinner}:${bet.bet}`).join("|")}
          onError={onError}
          onSave={onSave}
          players={players}
        />
      ) : (
        <AdminPlayersScoresTable draftScores={draftScores} onScoreChange={onScoreChange} players={players} />
      )}
    </div>
  );
}
