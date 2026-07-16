import { useState } from "react";
import questionsData from "../../../assets/questions.json";
import { ChallengeResultScreen } from "./ChallengeResultScreen";
import { useChallengeResult } from "../model";
import type { QuizQuestion } from "../model";

const questions = questionsData.questions as QuizQuestion[];

type HostQuizChallengeProps = {
  challengeId: string;
  maxPoints: number;
  playerId: string;
};

export function HostQuizChallenge({ challengeId, maxPoints, playerId }: HostQuizChallengeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [isShowingEasterEgg, setIsShowingEasterEgg] = useState(false);
  const result = useChallengeResult({
    challengeId,
    playerId,
    loadErrorMessage: "Nie udało się sprawdzić zapisanego wyniku.",
    saveErrorMessage: "Nie udało się wysłać quizu. Spróbuj ponownie.",
  });

  if (result.isLoading) return <div className="challenge-result-loading" aria-label="Ładowanie wyniku quizu" />;
  if (result.score !== null) {
    return <ChallengeResultScreen maxPoints={maxPoints} score={result.score} title="Quiz ukończony" />;
  }

  const question = questions[currentQuestionIndex];
  const selectedAnswers = answers[currentQuestionIndex] ?? [];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const requiredSelections = question.type === "multiple-choice" ? question.maxSelections : 1;
  const isAnswerComplete = selectedAnswers.length === requiredSelections;

  const calculateScore = () => questions.reduce((score, item, index) => {
    const selected = answers[index] ?? [];
    if (item.type === "multiple-choice") {
      return score + selected.filter((answer) => item.correctAnswer.includes(answer)).length;
    }
    if (selected[0] !== item.correctAnswer) return score;
    return score + 1 + (item.easterEgg ? 1 : 0);
  }, 0);

  const advanceOrSubmit = async () => {
    if (!isLastQuestion) {
      setIsShowingEasterEgg(false);
      setCurrentQuestionIndex((index) => index + 1);
      return;
    }

    await result.submit(calculateScore());
  };

  const handleContinue = async () => {
    if (!isAnswerComplete || result.isSubmitting) return;
    result.setError("");

    if (question.type === "single-choice" && question.easterEgg && selectedAnswers[0] === question.correctAnswer) {
      setIsShowingEasterEgg(true);
      return;
    }

    await advanceOrSubmit();
  };

  if (isShowingEasterEgg && question.type === "single-choice" && question.easterEgg) {
    return (
      <div className="host-quiz-step quiz-easter-egg-step">
        <div className="quiz-easter-egg">
          <span aria-hidden="true">+1</span>
          <p>EASTER EGG</p>
          <h2 id="active-challenge-title">{question.easterEgg}</h2>
          <strong id="active-challenge-description">Bonusowy punkt trafia na Twoje konto.</strong>
        </div>
        <div className="challenge-submit-bar quiz-submit-bar">
          <button type="button" disabled={result.isSubmitting} onClick={() => void advanceOrSubmit()}>
            {result.isSubmitting ? "WYSYŁAM..." : isLastQuestion ? "WYŚLIJ" : "DALEJ"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="host-quiz-step">
      <header className="challenge-task-header quiz-header">
        <p>KTO ZNA HOST · PYTANIE {currentQuestionIndex + 1} Z {questions.length}</p>
        <h2 id="active-challenge-title">{question.question}</h2>
        <span id="active-challenge-description">
          {question.type === "multiple-choice"
            ? `Wybierz dokładnie ${question.maxSelections} odpowiedzi · ${selectedAnswers.length}/${question.maxSelections}`
            : "Wybierz jedną odpowiedź."}
        </span>
      </header>

      <div className="quiz-progress" aria-hidden="true">
        <span style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="quiz-answers" role={question.type === "multiple-choice" ? "group" : "radiogroup"} aria-label={question.question}>
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswers.includes(answer);
          const isSelectionLimitReached = question.type === "multiple-choice" && selectedAnswers.length >= question.maxSelections;
          return (
            <button
              className={isSelected ? "is-selected" : ""}
              key={answer}
              type="button"
              role={question.type === "multiple-choice" ? "checkbox" : "radio"}
              aria-checked={isSelected}
              aria-disabled={!isSelected && isSelectionLimitReached}
              onClick={() => setAnswers((current) => {
                if (question.type === "single-choice") {
                  return { ...current, [currentQuestionIndex]: [answer] };
                }
                const currentSelections = current[currentQuestionIndex] ?? [];
                if (currentSelections.includes(answer)) {
                  return { ...current, [currentQuestionIndex]: currentSelections.filter((selection) => selection !== answer) };
                }
                if (currentSelections.length >= question.maxSelections) return current;
                return { ...current, [currentQuestionIndex]: [...currentSelections, answer] };
              })}
            >
              <span className="quiz-answer-marker" aria-hidden="true">
                <i>{String.fromCharCode(65 + index)}</i><b>✓</b>
              </span>
              <strong>{answer}</strong>
            </button>
          );
        })}
      </div>

      <div className="challenge-submit-bar quiz-submit-bar">
        {result.error && <span role="alert">{result.error}</span>}
        <button type="button" disabled={!isAnswerComplete || result.isSubmitting} onClick={() => void handleContinue()}>
          {result.isSubmitting ? "WYSYŁAM..." : isLastQuestion ? "WYŚLIJ" : "DALEJ"}
        </button>
      </div>
    </div>
  );
}
