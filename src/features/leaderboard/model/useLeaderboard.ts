import { useEffect, useRef, useState } from "react";
import { getLeaderboardPlayers } from "../api";
import type { LeaderboardPlayer } from "../api";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { supabase } from "../../../utils/supabase";

export function useLeaderboard() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [changedCountries, setChangedCountries] = useState<Set<CountryCode>>(new Set());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const previousPoints = useRef(new Map<CountryCode, number>());
  const hasLoadedPlayers = useRef(false);
  const highlightTimeout = useRef<number | null>(null);

  useEffect(() => {
    let isActive = true;
    let isRefreshInProgress = false;

    const refresh = async () => {
      if (isRefreshInProgress) return;
      isRefreshInProgress = true;
      try {
        const nextPlayers = await getLeaderboardPlayers();
        if (!isActive) return;

        if (hasLoadedPlayers.current) {
          const changed = new Set(
            nextPlayers
              .filter((player) => previousPoints.current.get(player.country) !== player.points)
              .map((player) => player.country),
          );
          if (changed.size > 0) {
            setChangedCountries(changed);
            if (highlightTimeout.current) window.clearTimeout(highlightTimeout.current);
            highlightTimeout.current = window.setTimeout(() => setChangedCountries(new Set()), 1100);
          }
        }

        previousPoints.current = new Map(nextPlayers.map((player) => [player.country, player.points]));
        hasLoadedPlayers.current = true;
        setPlayers(nextPlayers);
        setError("");
      } catch {
        if (isActive) setError("Nie udało się pobrać aktualnej tabeli. Spróbuj ponownie za chwilę.");
      } finally {
        isRefreshInProgress = false;
        if (isActive) setIsLoading(false);
      }
    };

    void refresh();
    const fallbackRefresh = window.setInterval(() => void refresh(), 2000);
    const channel = supabase
      .channel("players-leaderboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => void refresh())
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" && isActive) {
          setError("Połączenie realtime zostało przerwane. Odśwież stronę, aby połączyć się ponownie.");
        }
      });

    return () => {
      isActive = false;
      window.clearInterval(fallbackRefresh);
      if (highlightTimeout.current) window.clearTimeout(highlightTimeout.current);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { changedCountries, error, isLoading, players, setError };
}
