import { useEffect, useState } from "react";
import questionsData from "../../../assets/questions.json";
import { getChallengeResult, saveChallengeResult } from "../api";
import { ChallengeResultScreen } from "./ChallengeResultScreen";

type SingleChoiceQuestion = {
  answers: string[];
  correctAnswer: string;
  easterEgg?: string;
  question: string;
  type: "single-choice";
};

type MultipleChoiceQuestion = {
  answers: string[];
  correctAnswer: string[];
  maxSelections: number;
  question: string;
  type: "multiple-choice";
};

type QuizQuestion = SingleChoiceQuestion | MultipleChoiceQuestion;

const questions = questionsData.questions as QuizQuestion[];

type HostQuizChallengeProps = {
  challengeId: string;
  maxPoints: number;
  playerToken: string;
};

export function HostQuizChallenge({ challengeId, maxPoints, playerToken }: HostQuizChallengeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShowingEasterEgg, setIsShowingEasterEgg] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    getChallengeResult(challengeId, playerToken)
      .then((score) => { if (isActive) setSavedScore(score); })
      .catch(() => { if (isActive) setError("Nie udało się sprawdzić zapisanego wyniku."); })
      .finally(() => { if (isActive) setIsLoadingResult(false); });
    return () => { isActive = false; };
  }, [challengeId, playerToken]);

  if (isLoadingResult) return <div className="challenge-result-loading" aria-label="Ładowanie wyniku quizu" />;
  if (savedScore !== null) {
    return <ChallengeResultScreen maxPoints={maxPoints} score={savedScore} title="Quiz ukończony" />;
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

    setIsSubmitting(true);
    try {
      const score = await saveChallengeResult(challengeId, playerToken, calculateScore());
      setSavedScore(score);
    } catch {
      setError("Nie udało się wysłać quizu. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!isAnswerComplete || isSubmitting) return;
    setError("");

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
          <button type="button" disabled={isSubmitting} onClick={() => void advanceOrSubmit()}>
            {isSubmitting ? "WYSYŁAM..." : isLastQuestion ? "WYŚLIJ" : "DALEJ"}
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
        {error && <span role="alert">{error}</span>}
        <button type="button" disabled={!isAnswerComplete || isSubmitting} onClick={() => void handleContinue()}>
          {isSubmitting ? "WYSYŁAM..." : isLastQuestion ? "WYŚLIJ" : "DALEJ"}
        </button>
      </div>
    </div>
  );
}
