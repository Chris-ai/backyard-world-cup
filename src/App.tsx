import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { claimPlayer, updatePlayerName } from "./features/join-game/api";
import { resolveInviteFromToken } from "./features/join-game/model";
import { JoinGameModal } from "./features/join-game/ui";
import { LeaderboardTable } from "./features/leaderboard/ui";
import { ActiveChallengeDrawer } from "./features/active-challenge/ui";
import { NotFoundPage } from "./pages/not-found/ui";
import { AdminPage } from "./pages/admin/ui";
import type { CountryCode } from "./shared/ui/country-flag";
import "./App.css";

type JoinedPlayer = {
  country: CountryCode;
  id: string;
  isAdmin: boolean;
  name: string;
};

const PLAYER_TOKEN_STORAGE_KEY = "token";

function GameShell({ children }: { children: ReactNode }) {
  return (
    <main className="game-shell">
      <div className="background-shapes" aria-hidden="true">
        <span className="shape shape--bottom" />
        <span className="shape shape--red" />
        <span className="shape shape--cream" />
        <span className="shape shape--blue" />
      </div>
      {children}
    </main>
  );
}

function getActiveInviteToken(): string | null {
  const urlToken = new URLSearchParams(window.location.search).get("invite");
  if (resolveInviteFromToken(urlToken)) return urlToken;

  const storedToken = localStorage.getItem(PLAYER_TOKEN_STORAGE_KEY);
  return resolveInviteFromToken(storedToken) ? storedToken : null;
}

function App() {
  const [inviteToken] = useState<string | null>(getActiveInviteToken);
  const inviteTarget = resolveInviteFromToken(inviteToken);
  const invitedCountry: CountryCode = inviteTarget?.type === "country" ? inviteTarget.country : "belgium";
  const [joinedPlayer, setJoinedPlayer] = useState<JoinedPlayer | null>(null);
  const [claimedPlayer, setClaimedPlayer] = useState<Awaited<ReturnType<typeof claimPlayer>> | null>(null);
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
        if (player.name) setJoinedPlayer({ id: player.id, isAdmin: player.isAdmin, name: player.name, country: invitedCountry });
      })
      .catch((error: unknown) => {
        if (isActive) setAuthError(error instanceof Error ? error.message : "Nie udało się przypisać gracza do sesji.");
      })
      .finally(() => {
        if (isActive) setIsRestoringPlayer(false);
      });

    return () => {
      isActive = false;
    };
  }, [inviteToken, invitedCountry]);

  const handleJoin = async (name: string) => {
    if (!claimedPlayer) throw new Error("Brak gracza przypisanego do sesji.");

    const savedName = await updatePlayerName(claimedPlayer.id, name);
    setJoinedPlayer({ id: claimedPlayer.id, isAdmin: claimedPlayer.isAdmin, name: savedName, country: invitedCountry });
  };

  if (!inviteToken) {
    return (
      <GameShell>
        <NotFoundPage />
      </GameShell>
    );
  }

  if (authError) {
    return <GameShell><NotFoundPage /></GameShell>;
  }

  if (claimedPlayer?.isAdmin) {
    return (
      <GameShell>
        <AdminPage />
      </GameShell>
    );
  }

  return (
    <GameShell>
      {joinedPlayer && (
        <>
          <LeaderboardTable currentCountry={joinedPlayer.country} />
          <ActiveChallengeDrawer playerId={joinedPlayer.id} />
        </>
      )}

      <JoinGameModal
        country={invitedCountry}
        isOpen={!joinedPlayer && !isRestoringPlayer}
        onJoin={handleJoin}
      />
    </GameShell>
  );
}

export default App;
