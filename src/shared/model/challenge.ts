export type ChallengeStatus = "closed" | "open" | "pending";
export type ActiveChallengeStatus = Exclude<ChallengeStatus, "closed">;

export const CHALLENGE_NAMES = {
  grandeFinale: "grande finale",
  hallOfFame: "galeria sław",
  hostQuiz: "kto zna host",
} as const;

export function normalizeChallengeName(name: string | undefined): string {
  return name?.trim().toLocaleLowerCase("pl") ?? "";
}
