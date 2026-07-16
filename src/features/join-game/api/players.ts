import { supabase } from "../../../utils/supabase";

type PlayerNameRow = {
  name: string | null;
};

export async function getPlayerNameByToken(token: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("players")
    .select("name")
    .eq("token", token)
    .maybeSingle<PlayerNameRow>();

  if (error) throw error;

  return data?.name?.trim() || null;
}

export async function updatePlayerName(token: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from("players")
    .update({ name })
    .eq("token", token)
    .select("name")
    .maybeSingle<PlayerNameRow>();

  if (error) throw error;
  if (!data) throw new Error("Nie znaleziono gracza dla tego tokenu zaproszenia.");

  return data.name?.trim() || name;
}
