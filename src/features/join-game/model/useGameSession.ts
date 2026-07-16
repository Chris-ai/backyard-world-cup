import { useEffect, useState } from "react";
import { claimPlayer, updatePlayerName } from "../api";
import type { ClaimedPlayer } from "../api";
import type { CountryCode } from "../../../shared/ui/country-flag";
import { resolveInviteFromToken } from "./country-invites";

const PLAYER_TOKEN_STORAGE_KEY = "token";

export type JoinedPlayer = {
  country: CountryCode;
  id: string;
  isAdmin: boolean;
  name: string;
};

function getActiveInviteToken(): string | null {
  const urlToken = new URLSearchParams(window.location.search).get("invite");
  if (resolveInviteFromToken(urlToken)) return urlToken;
  const storedToken = localStorage.getItem(PLAYER_TOKEN_STORAGE_KEY);
  return resolveInviteFromToken(storedToken) ? storedToken : null;
}

export function useGameSession() {
  const [inviteToken] = useState<string | null>(getActiveInviteToken);
  const inviteTarget = resolveInviteFromToken(inviteToken);
  const invitedCountry: CountryCode = inviteTarget?.type === "country" ? inviteTarget.country : "belgium";
  const [joinedPlayer, setJoinedPlayer] = useState<JoinedPlayer | null>(null);
  const [claimedPlayer, setClaimedPlayer] = useState<ClaimedPlayer | null>(null);
  const [isRestoringPlayer, setIsRestoringPlayer] = useState(Boolean(inviteToken));
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!inviteToken) return;
    let isActive = true;
    claimPlayer(inviteToken)
      .then((player) => {
        if (!isActive) return;
        setClaimedPlayer(player);
        localStorage.setItem(PLAYER_TOKEN_STORAGE_KEY, inviteToken);
        if (player.name) {
          setJoinedPlayer({ id: player.id, isAdmin: player.isAdmin, name: player.name, country: invitedCountry });
        }
      })
      .catch((error: unknown) => {
        if (isActive) setAuthError(error instanceof Error ? error.message : "Nie udało się przypisać gracza do sesji.");
      })
      .finally(() => {
        if (isActive) setIsRestoringPlayer(false);
      });
    return () => { isActive = false; };
  }, [inviteToken, invitedCountry]);

  const join = async (name: string) => {
    if (!claimedPlayer) throw new Error("Brak gracza przypisanego do sesji.");
    const savedName = await updatePlayerName(claimedPlayer.id, name);
    setJoinedPlayer({ id: claimedPlayer.id, isAdmin: claimedPlayer.isAdmin, name: savedName, country: invitedCountry });
  };

  return { authError, claimedPlayer, inviteToken, invitedCountry, isRestoringPlayer, joinedPlayer, join };
}
