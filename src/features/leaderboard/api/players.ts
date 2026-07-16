import { COUNTRIES } from "../../../shared/ui/country-flag";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { supabase } from "../../../utils/supabase";

type LeaderboardPlayerRow = {
  name: string | null;
  team_name: string;
  token: string;
};

type ResultRow = {
  player_token: string;
  score: number | null;
};

export type LeaderboardPlayer = {
  country: CountryCode;
  name: string;
  points: number;
};

function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES;
}

export async function getLeaderboardPlayers(): Promise<LeaderboardPlayer[]> {
  const [playersResponse, resultsResponse] = await Promise.all([
    supabase
      .from("players")
      .select("token,team_name,name")
      .not("name", "is", null),
    supabase.from("results").select("player_token,score"),
  ]);

  const error = playersResponse.error ?? resultsResponse.error;
  if (error) throw error;

  const pointsByPlayer = new Map<string, number>();
  ((resultsResponse.data ?? []) as ResultRow[]).forEach((result) => {
    const score = Number.isFinite(result.score) ? Number(result.score) : 0;
    pointsByPlayer.set(result.player_token, (pointsByPlayer.get(result.player_token) ?? 0) + score);
  });

  return ((playersResponse.data ?? []) as LeaderboardPlayerRow[])
    .flatMap((player) => {
      const name = player.name?.trim();
      if (!name || !isCountryCode(player.team_name)) return [];

      return [{
        country: player.team_name,
        name,
        points: pointsByPlayer.get(player.token) ?? 0,
      }];
    })
    .sort((firstPlayer, secondPlayer) =>
      secondPlayer.points - firstPlayer.points
      || firstPlayer.name.localeCompare(secondPlayer.name, "pl", { sensitivity: "base" }),
    );
}
