import { supabase } from "../../../utils/supabase";

export type FinalBet = {
  bet: number;
  predictedScoreA: number;
  predictedScoreB: number;
  predictedWinner: "a" | "b";
};

type FinalBetRow = {
  bet: number;
  id?: string;
  player_token?: string;
  predicted_score_a: number;
  predicted_score_b: number;
  predicted_winner: "a" | "b";
};

function mapBet(row: FinalBetRow): FinalBet {
  return {
    bet: Number(row.bet),
    predictedScoreA: Number(row.predicted_score_a),
    predictedScoreB: Number(row.predicted_score_b),
    predictedWinner: row.predicted_winner,
  };
}

export async function getFinalBet(playerToken: string): Promise<FinalBet | null> {
  const { data, error } = await supabase
    .from("bets")
    .select("bet,predicted_score_a,predicted_score_b,predicted_winner")
    .eq("player_token", playerToken)
    .maybeSingle<FinalBetRow>();

  if (error) throw error;
  return data ? mapBet(data) : null;
}

export async function getPlayerTotalPoints(playerToken: string): Promise<number> {
  const { data, error } = await supabase
    .from("results")
    .select("score")
    .eq("player_token", playerToken);

  if (error) throw error;
  return (data ?? []).reduce((total, result) => total + Number(result.score ?? 0), 0);
}

export async function saveFinalBet(playerToken: string, bet: FinalBet): Promise<FinalBet> {
  const row = {
    bet: bet.bet,
    player_token: playerToken,
    predicted_score_a: bet.predictedScoreA,
    predicted_score_b: bet.predictedScoreB,
    predicted_winner: bet.predictedWinner,
  };

  const existing = await supabase
    .from("bets")
    .select("id")
    .eq("player_token", playerToken)
    .maybeSingle<{ id: string }>();

  if (existing.error) throw existing.error;

  const response = existing.data
    ? await supabase.from("bets").update(row).eq("id", existing.data.id).select("bet,predicted_score_a,predicted_score_b,predicted_winner").single<FinalBetRow>()
    : await supabase.from("bets").insert(row).select("bet,predicted_score_a,predicted_score_b,predicted_winner").single<FinalBetRow>();

  if (response.error) throw response.error;
  return mapBet(response.data);
}
