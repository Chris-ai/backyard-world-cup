import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  ArgentinaFlag,
  BrazilFlag,
  EnglandFlag,
  FranceFlag,
  GermanyFlag,
  ItalyFlag,
  NetherlandsFlag,
  PortugalFlag,
  SpainFlag,
  UruguayFlag,
} from "../../../shared/ui/country-flag/flags";
import type { FlagProps } from "../../../shared/ui/country-flag/flags/types";
import { getChallengeResult, saveChallengeResult } from "../api";
import { ChallengeResultScreen } from "./ChallengeResultScreen";

type ChoiceRole = "impostor" | "winner";

type HallOfFameCountry = {
  code: string;
  flag: ComponentType<FlagProps>;
  name: string;
};

const hallOfFameCountries: HallOfFameCountry[] = [
  { code: "URU", name: "Urugwaj", flag: UruguayFlag },
  { code: "ITA", name: "Włochy", flag: ItalyFlag },
  { code: "GER", name: "Niemcy", flag: GermanyFlag },
  { code: "BRA", name: "Brazylia", flag: BrazilFlag },
  { code: "ENG", name: "Anglia", flag: EnglandFlag },
  { code: "ARG", name: "Argentyna", flag: ArgentinaFlag },
  { code: "FRA", name: "Francja", flag: FranceFlag },
  { code: "ESP", name: "Hiszpania", flag: SpainFlag },
  { code: "NED", name: "Holandia", flag: NetherlandsFlag },
  { code: "POR", name: "Portugalia", flag: PortugalFlag },
];

type HallOfFameChallengeProps = {
  challengeId: string;
  maxPoints: number;
  playerToken: string;
};

export function HallOfFameChallenge({ challengeId, maxPoints, playerToken }: HallOfFameChallengeProps) {
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, ChoiceRole>>({});
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let isActive = true;

    getChallengeResult(challengeId, playerToken)
      .then((score) => {
        if (isActive) setSavedScore(score);
      })
      .catch(() => {
        if (isActive) setSubmitError("Nie udało się sprawdzić zapisanej odpowiedzi.");
      })
      .finally(() => {
        if (isActive) setIsLoadingResult(false);
      });

    return () => {
      isActive = false;
    };
  }, [challengeId, playerToken]);

  if (isLoadingResult) {
    return <div className="challenge-result-loading" aria-label="Ładowanie wyniku" />;
  }

  if (savedScore !== null) return <ChallengeResultScreen maxPoints={maxPoints} score={savedScore} />;

  const winnerCount = Object.values(selections).filter((role) => role === "winner").length;
  const impostorCount = Object.values(selections).filter((role) => role === "impostor").length;
  const isComplete = winnerCount === 1 && impostorCount === 2;

  const calculateScore = () => {
    let score = 0;
    if (selections.BRA === "winner") score += 3;
    if (selections.NED === "impostor") score += 1;
    if (selections.POR === "impostor") score += 1;
    return score;
  };

  const handleSubmit = async () => {
    if (!isComplete || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const score = await saveChallengeResult(challengeId, playerToken, calculateScore());
      setSavedScore(score);
    } catch {
      setSubmitError("Nie udało się zapisać wyniku. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
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
        {hallOfFameCountries.map(({ code, flag: Flag, name }) => {
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
        {submitError && <span role="alert">{submitError}</span>}
        <button type="button" disabled={!isComplete || isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? "ZAPISUJĘ WYNIK..." : "ZATWIERDŹ ODPOWIEDŹ"}
        </button>
      </div>
    </div>
  );
}
