import type { CSSProperties } from "react";

type ChallengeResultScreenProps = {
  description?: string;
  maxPoints: number;
  score: number;
  title?: string;
};

export function ChallengeResultScreen({
  description = "To Twój wynik. Poczekaj na zakończenie zadania, aby zobaczyć tabelę.",
  maxPoints,
  score,
  title = "Wybór zatwierdzony",
}: ChallengeResultScreenProps) {
  const safeMaxPoints = Math.max(0, maxPoints);
  const progress = safeMaxPoints > 0 ? Math.min(Math.max(score / safeMaxPoints, 0), 1) : 0;
  const resultKind = score === 0 ? "weak" : safeMaxPoints > 0 && score >= safeMaxPoints ? "goat" : "regular";

  return (
    <div className={`challenge-result challenge-result--${resultKind}`}>
      <div
        className="challenge-result__circle"
        style={{ "--score-progress-target": `${progress * 360}deg` } as CSSProperties}
      >
        <div><strong>{score}/{safeMaxPoints}</strong></div>
      </div>
      <p className="challenge-result__label">
        {resultKind === "goat" ? "G.O.A.T." : resultKind === "weak" ? "Następnym razem będzie lepiej" : "Dobry wynik!"}
      </p>
      <h2 id="active-challenge-title">{title}</h2>
      <p id="active-challenge-description">{description}</p>
    </div>
  );
}
