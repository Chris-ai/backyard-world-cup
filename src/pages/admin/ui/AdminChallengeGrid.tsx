import type { AdminChallenge } from "../../../features/admin/model";

const STATUS_LABELS = {
  closed: "ZAMKNIĘTE",
  open: "AKTYWNE",
  pending: "W TRAKCIE",
} as const;

type AdminChallengeGridProps = {
  activeChallengeId: string | null;
  challenges: AdminChallenge[];
  onToggle: (challengeId: string) => void;
};

export function AdminChallengeGrid({ activeChallengeId, challenges, onToggle }: AdminChallengeGridProps) {
  return (
    <div className="challenge-grid" aria-label="Lista konkurencji">
      {challenges.map((challenge, index) => {
        const isActive = challenge.id === activeChallengeId;
        return (
          <button
            className={`challenge-tile ${isActive ? "challenge-tile--active" : ""} challenge-tile--${challenge.status}`.trim()}
            key={challenge.id}
            type="button"
            onClick={() => onToggle(challenge.id)}
            aria-expanded={isActive}
            aria-controls="challenge-results"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{challenge.name}</strong>
            <small>{STATUS_LABELS[challenge.status]}</small>
            <i aria-hidden="true">{isActive ? "−" : "+"}</i>
          </button>
        );
      })}
    </div>
  );
}
