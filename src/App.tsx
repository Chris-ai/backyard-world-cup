import type { ReactNode } from "react";
import { ActiveChallengeDrawer } from "./features/active-challenge/ui";
import { useGameSession } from "./features/join-game/model";
import { JoinGameModal } from "./features/join-game/ui";
import { LeaderboardTable } from "./features/leaderboard/ui";
import { AdminPage } from "./pages/admin/ui";
import { NotFoundPage } from "./pages/not-found/ui";
import { GameBackground } from "./shared/ui/game-background";
import "./App.css";

function GameShell({ children }: { children: ReactNode }) {
  return <main className="game-shell"><GameBackground />{children}</main>;
}

function App() {
  const session = useGameSession();

  if (!session.inviteToken || session.authError) {
    return <GameShell><NotFoundPage /></GameShell>;
  }

  if (session.claimedPlayer?.isAdmin) {
    return <GameShell><AdminPage /></GameShell>;
  }

  return (
    <GameShell>
      {session.joinedPlayer && (
        <>
          <LeaderboardTable currentCountry={session.joinedPlayer.country} />
          <ActiveChallengeDrawer playerId={session.joinedPlayer.id} />
        </>
      )}
      <JoinGameModal
        country={session.invitedCountry}
        isOpen={!session.joinedPlayer && !session.isRestoringPlayer}
        onJoin={session.join}
      />
    </GameShell>
  );
}

export default App;
