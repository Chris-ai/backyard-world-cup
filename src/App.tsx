import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getPlayerNameByToken, updatePlayerName } from "./features/join-game/api";
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
  const [isRestoringPlayer, setIsRestoringPlayer] = useState(
    () => Boolean(
      inviteTarget?.type === "country"
      && inviteToken
      && localStorage.getItem(PLAYER_TOKEN_STORAGE_KEY) === inviteToken,
    ),
  );

  useEffect(() => {
    if (inviteTarget?.type === "admin" && inviteToken) {
      localStorage.setItem(PLAYER_TOKEN_STORAGE_KEY, inviteToken);
    }
  }, [inviteTarget?.type, inviteToken]);

  useEffect(() => {
    if (!isRestoringPlayer || !inviteToken) return;

    let isActive = true;

    getPlayerNameByToken(inviteToken)
      .then((name) => {
        if (isActive && name) setJoinedPlayer({ name, country: invitedCountry });
      })
      .catch(() => {
        // Przy problemie z odtworzeniem sesji użytkownik może ponowić dołączenie w modalu.
      })
      .finally(() => {
        if (isActive) setIsRestoringPlayer(false);
      });

    return () => {
      isActive = false;
    };
  }, [inviteToken, invitedCountry, isRestoringPlayer]);

  const handleJoin = async (name: string) => {
    if (!inviteToken) {
      throw new Error("Brak poprawnego tokenu zaproszenia w adresie.");
    }

    const savedName = await updatePlayerName(inviteToken, name);
    localStorage.setItem(PLAYER_TOKEN_STORAGE_KEY, inviteToken);
    setJoinedPlayer({ name: savedName, country: invitedCountry });
  };

  if (!inviteToken) {
    return (
      <GameShell>
        <NotFoundPage />
      </GameShell>
    );
  }

  if (inviteTarget?.type === "admin") {
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
          <ActiveChallengeDrawer playerToken={inviteToken} />
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
