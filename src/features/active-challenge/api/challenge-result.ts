import { supabase } from "../../../utils/supabase";

type ResultScoreRow = {
  id?: string;
  score: number | null;
};

export async function getChallengeResult(
  challengeId: string,
  playerToken: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("results")
    .select("score")
    .eq("challange_id", challengeId)
    .eq("player_token", playerToken)
    .maybeSingle<ResultScoreRow>();

  if (error) throw error;
  return data ? Number(data.score ?? 0) : null;
}

export async function saveChallengeResult(
  challengeId: string,
  playerToken: string,
  score: number,
): Promise<number> {
  const row = {
    challange_id: challengeId,
    player_token: playerToken,
    score,
  };

  const upsertResponse = await supabase
    .from("results")
    .upsert(row, { onConflict: "player_token,challange_id" })
    .select("score")
    .maybeSingle<ResultScoreRow>();

  if (!upsertResponse.error && upsertResponse.data) {
    return Number(upsertResponse.data.score ?? 0);
  }

  if (upsertResponse.error?.code !== "42P10") throw upsertResponse.error;

  const existingResponse = await supabase
    .from("results")
    .select("id")
    .eq("challange_id", challengeId)
    .eq("player_token", playerToken)
    .maybeSingle<{ id: string }>();

  if (existingResponse.error) throw existingResponse.error;

  const saveResponse = existingResponse.data
    ? await supabase
      .from("results")
      .update({ score })
      .eq("id", existingResponse.data.id)
      .select("score")
      .single<ResultScoreRow>()
    : await supabase
      .from("results")
      .insert(row)
      .select("score")
      .single<ResultScoreRow>();

  if (saveResponse.error) throw saveResponse.error;
  return Number(saveResponse.data.score ?? 0);
}
