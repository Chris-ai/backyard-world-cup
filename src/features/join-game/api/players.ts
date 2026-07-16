import { supabase } from "../../../utils/supabase";

export type ClaimedPlayer = {
  id: string;
  isAdmin: boolean;
  name: string | null;
  teamName: string;
};

type ClaimedPlayerRow = {
  id: string;
  is_admin: boolean | null;
  name: string | null;
  team_name: string;
};

export async function claimPlayer(inviteToken: string): Promise<ClaimedPlayer> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  if (!sessionData.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  const { data, error } = await supabase
    .rpc("claim_player", { invite_token: inviteToken });

  if (error) throw error;
  const player = (data as ClaimedPlayerRow[] | null)?.[0];
  if (!player) throw new Error("Ten token jest już przypisany do innego urządzenia albo jest nieprawidłowy.");

  return {
    id: player.id,
    isAdmin: Boolean(player.is_admin),
    name: player.name?.trim() || null,
    teamName: player.team_name,
  };
}

export async function updatePlayerName(playerId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from("players")
    .update({ name })
    .eq("id", playerId)
    .select("name")
    .maybeSingle<{ name: string | null }>();

  if (error) throw error;
  if (!data) throw new Error("Nie znaleziono gracza przypisanego do tej sesji.");
  return data.name?.trim() || name;
}
