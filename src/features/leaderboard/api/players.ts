import { isCountryCode } from "../../../shared/ui/country-flag";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { supabase } from "../../../utils/supabase";

type LeaderboardPlayerRow = {
  id: string;
  name: string | null;
  team_name: string;
};

type ResultRow = {
  player_id: string;
  score: number | null;
};

export type LeaderboardPlayer = {
  country: CountryCode;
  name: string;
  points: number;
};

export async function getLeaderboardPlayers(): Promise<LeaderboardPlayer[]> {
  const [playersResponse, resultsResponse] = await Promise.all([
    supabase
      .from("players")
      .select("id,team_name,name")
      .not("name", "is", null),
    supabase.from("results").select("player_id,score"),
  ]);

  const error = playersResponse.error ?? resultsResponse.error;
  if (error) throw error;

  const pointsByPlayer = new Map<string, number>();
  ((resultsResponse.data ?? []) as ResultRow[]).forEach((result) => {
    const score = Number.isFinite(result.score) ? Number(result.score) : 0;
    pointsByPlayer.set(result.player_id, (pointsByPlayer.get(result.player_id) ?? 0) + score);
  });

  return ((playersResponse.data ?? []) as LeaderboardPlayerRow[])
    .flatMap((player) => {
      const name = player.name?.trim();
      if (!name || !isCountryCode(player.team_name)) return [];

      return [{
        country: player.team_name,
        name,
        points: pointsByPlayer.get(player.id) ?? 0,
      }];
    })
    .sort((firstPlayer, secondPlayer) =>
      secondPlayer.points - firstPlayer.points
      || firstPlayer.name.localeCompare(secondPlayer.name, "pl", { sensitivity: "base" }),
    );
}
