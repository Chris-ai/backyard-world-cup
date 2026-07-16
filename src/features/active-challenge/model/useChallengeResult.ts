import { useEffect, useState } from "react";
import { getChallengeResult, saveChallengeResult } from "../api";

type UseChallengeResultOptions = {
  challengeId: string;
  loadErrorMessage: string;
  playerId: string;
  saveErrorMessage: string;
};

export function useChallengeResult(options: UseChallengeResultOptions) {
  const { challengeId, loadErrorMessage, playerId, saveErrorMessage } = options;
  const [score, setScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    getChallengeResult(challengeId, playerId)
      .then((savedScore) => { if (isActive) setScore(savedScore); })
      .catch(() => { if (isActive) setError(loadErrorMessage); })
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [challengeId, loadErrorMessage, playerId]);

  const submit = async (nextScore: number) => {
    setIsSubmitting(true);
    setError("");
    try {
      setScore(await saveChallengeResult(challengeId, playerId, nextScore));
      return true;
    } catch {
      setError(saveErrorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { error, isLoading, isSubmitting, score, setError, submit };
}
