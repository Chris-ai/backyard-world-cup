import { supabase } from "../../../utils/supabase";

export type AdminChallenge = {
  id: string;
  name: string;
  sortOrder: number;
  status: ChallengeStatus;
  type: string;
};

export type ChallengeStatus = "closed" | "open" | "pending";

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

type ChallengeRow = { id: string; name: string; sort_order: number | null; status: ChallengeStatus; type: string };
type LegacyChallengeRow = { id: string; isOpen: boolean; name: string; sort_order: number | null; type: string };
type PlayerRow = { id: string; isAdmin: boolean | null; name: string | null; team_name: string };
type ResultRow = { challange_id: string; player_id: string; score: number | null };
type ExistingResultRow = { id: string; player_id: string };
type BetRow = { bet: number; player_id: string; predicted_score_a: number; predicted_score_b: number; predicted_winner: "a" | "b" };

type DatabaseError = {
  code?: string;
  message: string;
};

function throwDatabaseError(error: DatabaseError): never {
  throw new Error(error.message);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const statusResponse = await supabase
    .from("challenges")
    .select("id,name,status,sort_order,type")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  let challengeRows: ChallengeRow[];
  let challengeError = statusResponse.error;

  if (statusResponse.error?.code === "42703") {
    const legacyResponse = await supabase
      .from("challenges")
      .select("id,name,isOpen,sort_order,type")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    challengeError = legacyResponse.error;
    challengeRows = ((legacyResponse.data ?? []) as LegacyChallengeRow[]).map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      sort_order: challenge.sort_order,
      status: challenge.isOpen ? "open" : "pending",
      type: challenge.type,
    }));
  } else {
    challengeRows = (statusResponse.data ?? []) as ChallengeRow[];
  }

  const [playersResponse, resultsResponse, betsResponse] = await Promise.all([
    supabase.from("players").select("id,team_name,name,isAdmin").order("team_name"),
    supabase.from("results").select("player_id,challange_id,score"),
    supabase.from("bets").select("player_id,predicted_score_a,predicted_score_b,predicted_winner,bet"),
  ]);

  const error = challengeError ?? playersResponse.error ?? resultsResponse.error ?? betsResponse.error;
  if (error) throw error;

  return {
    bets: ((betsResponse.data ?? []) as BetRow[]).map((bet) => ({
      bet: Number(bet.bet),
      playerId: bet.player_id,
      predictedScoreA: Number(bet.predicted_score_a),
      predictedScoreB: Number(bet.predicted_score_b),
      predictedWinner: bet.predicted_winner,
    })),
    challenges: challengeRows.map((challenge) => ({
      id: challenge.id,
      name: challenge.name,
      sortOrder: challenge.sort_order ?? Number.MAX_SAFE_INTEGER,
      status: challenge.status,
      type: challenge.type,
    })),
    players: ((playersResponse.data ?? []) as PlayerRow[])
      .filter((player) => !player.isAdmin)
      .map((player) => ({
        id: player.id,
        name: player.name?.trim() || null,
        teamName: player.team_name,
      })),
    results: ((resultsResponse.data ?? []) as ResultRow[]).map((result) => ({
      challengeId: result.challange_id,
      playerId: result.player_id,
      score: Number.isFinite(result.score) ? Number(result.score) : 0,
    })),
  };
}

export async function setChallengeStatus(challengeId: string, status: ChallengeStatus): Promise<void> {
  let { data, error } = await supabase
    .from("challenges")
    .update({ status })
    .eq("id", challengeId)
    .select("id")
    .maybeSingle();

  if (error?.code === "42703") {
    const legacyResponse = await supabase
      .from("challenges")
      .update({ isOpen: status === "open" })
      .eq("id", challengeId)
      .select("id")
      .maybeSingle();
    data = legacyResponse.data;
    error = legacyResponse.error;
  }

  if (error) throwDatabaseError(error);
  if (!data) throw new Error("Nie znaleziono wybranej konkurencji.");
}

export async function saveChallengeScores(
  challengeId: string,
  scores: Array<{ playerId: string; score: number }>,
): Promise<void> {
  const rows = scores.map(({ playerId, score }) => ({
    challange_id: challengeId,
    player_id: playerId,
    score,
  }));

  const { error } = await supabase
    .from("results")
    .upsert(rows, { onConflict: "player_id,challange_id" });

  if (!error) return;
  if (error.code !== "42P10") throwDatabaseError(error);

  // Starsze schematy bez UNIQUE(player_id, challange_id): aktualizujemy
  // istniejące rekordy po id, a brakujące dopisujemy osobno.
  const { data: existingData, error: existingError } = await supabase
    .from("results")
    .select("id,player_id")
    .eq("challange_id", challengeId);

  if (existingError) throwDatabaseError(existingError);

  const existingByPlayer = new Map(
    ((existingData ?? []) as ExistingResultRow[]).map((result) => [result.player_id, result.id]),
  );
  const rowsToInsert = rows.filter((row) => !existingByPlayer.has(row.player_id));
  const rowsToUpdate = rows.filter((row) => existingByPlayer.has(row.player_id));

  const operations = [
    ...(rowsToInsert.length > 0
      ? [supabase.from("results").insert(rowsToInsert)]
      : []),
    ...rowsToUpdate.map((row) => supabase
      .from("results")
      .update({ score: row.score })
      .eq("id", existingByPlayer.get(row.player_id)!)),
  ];

  const responses = await Promise.all(operations);
  const fallbackError = responses.find((response) => response.error)?.error;
  if (fallbackError) throwDatabaseError(fallbackError);
}
