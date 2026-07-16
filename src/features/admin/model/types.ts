import type { ChallengeStatus } from "../../../shared/model/challenge";

export type AdminChallenge = {
  id: string;
  name: string;
  sortOrder: number;
  status: ChallengeStatus;
  type: string;
};

export type AdminPlayer = {
  id: string;
  name: string | null;
  teamName: string;
};

export type AdminResult = {
  challengeId: string;
  playerId: string;
  score: number;
};

export type AdminBet = {
  bet: number;
  playerId: string;
  predictedScoreA: number;
  predictedScoreB: number;
  predictedWinner: "a" | "b";
};

export type AdminDashboardData = {
  bets: AdminBet[];
  challenges: AdminChallenge[];
  players: AdminPlayer[];
  results: AdminResult[];
};

export type PlayerScore = { playerId: string; score: number };
