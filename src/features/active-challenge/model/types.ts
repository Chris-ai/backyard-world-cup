import type { ActiveChallengeStatus } from "../../../shared/model/challenge";

export type ActiveChallenge = {
  id: string;
  maxPoints: number;
  name: string;
  sortOrder: number;
  status: ActiveChallengeStatus;
};

export type FinalBet = {
  bet: number;
  predictedScoreA: number;
  predictedScoreB: number;
  predictedWinner: "a" | "b";
};
