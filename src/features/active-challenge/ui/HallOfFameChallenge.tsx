import { useState } from "react";
import { calculateHallOfFameScore, HALL_OF_FAME_COUNTRIES, useChallengeResult } from "../model";
import type { ChoiceRole } from "../model";
import { ChallengeResultScreen } from "./ChallengeResultScreen";

type HallOfFameChallengeProps = {
  challengeId: string;
  maxPoints: number;
  playerId: string;
};

export function HallOfFameChallenge({ challengeId, maxPoints, playerId }: HallOfFameChallengeProps) {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, ChoiceRole>>({});
  const result = useChallengeResult({
    challengeId,
    playerId,
    loadErrorMessage: "Nie udało się sprawdzić zapisanej odpowiedzi.",
    saveErrorMessage: "Nie udało się zapisać wyniku. Spróbuj ponownie.",
  });

  if (result.isLoading) {
    return <div className="challenge-result-loading" aria-label="Ładowanie wyniku" />;
  }

  if (result.score !== null) return <ChallengeResultScreen maxPoints={maxPoints} score={result.score} />;

  const winnerCount = Object.values(selections).filter((role) => role === "winner").length;
  const impostorCount = Object.values(selections).filter((role) => role === "impostor").length;
  const isComplete = winnerCount === 1 && impostorCount === 2;

  const handleSubmit = async () => {
    if (!isComplete || result.isSubmitting) return;
    await result.submit(calculateHallOfFameScore(selections));
  };

  const selectRole = (countryCode: string, role: ChoiceRole) => {
    setSelections((current) => {
      const next = { ...current };

      if (next[countryCode] === role) {
        delete next[countryCode];
        return next;
      }

      if (role === "winner") {
        Object.entries(next).forEach(([code, selectedRole]) => {
          if (selectedRole === "winner") delete next[code];
        });
      } else if (impostorCount >= 2 && next[countryCode] !== "impostor") {
        return current;
      }

      next[countryCode] = role;
      return next;
    });
  };

  return (
    <div className="hall-of-fame-step">
      <header className="challenge-task-header">
        <p>GALERIA SŁAW · KROK 1 Z 2</p>
        <h2 id="active-challenge-title">Wskaż legendę i impostorów</h2>
        <span id="active-challenge-description">Wybierz jednego najczęstszego mistrza świata i dwie drużyny, które nigdy nie wygrały turnieju.</span>
      </header>

      <div className="fame-selection-summary" aria-live="polite">
        <span className={winnerCount === 1 ? "is-complete" : ""}>ZWYCIĘZCA {winnerCount}/1</span>
        <span className={impostorCount === 2 ? "is-complete" : ""}>IMPOSTORZY {impostorCount}/2</span>
      </div>

      <div className="fame-country-list">
        {HALL_OF_FAME_COUNTRIES.map(({ code, flag: Flag, name }) => {
          const role = selections[code];
          const isExpanded = expandedCountry === code;
          return (
            <article className={`fame-country ${role ? `is-${role}` : ""} ${isExpanded ? "is-expanded" : ""}`.trim()} key={code}>
              <button
                className="fame-country__main"
                type="button"
                onClick={() => setExpandedCountry(isExpanded ? null : code)}
                aria-expanded={isExpanded}
              >
                <span className="challenge-choice-flag"><Flag focusable="false" /></span>
                <strong>{name}</strong>
                {role && <small>{role === "winner" ? "ZWYCIĘZCA" : "IMPOSTOR"}</small>}
                <i aria-hidden="true">{isExpanded ? "−" : "+"}</i>
              </button>

              {isExpanded && (
                <div className="fame-country__actions">
                  <button
                    className="choice-winner"
                    type="button"
                    onClick={() => selectRole(code, "winner")}
                    aria-pressed={role === "winner"}
                  >
                    ZWYCIĘZCA
                  </button>
                  <button
                    className="choice-impostor"
                    type="button"
                    onClick={() => selectRole(code, "impostor")}
                    aria-pressed={role === "impostor"}
                    disabled={impostorCount >= 2 && role !== "impostor"}
                  >
                    IMPOSTOR
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="challenge-submit-bar">
        {result.error && <span role="alert">{result.error}</span>}
        <button type="button" disabled={!isComplete || result.isSubmitting} onClick={() => void handleSubmit()}>
          {result.isSubmitting ? "ZAPISUJĘ WYNIK..." : "ZATWIERDŹ ODPOWIEDŹ"}
        </button>
      </div>
    </div>
  );
}
