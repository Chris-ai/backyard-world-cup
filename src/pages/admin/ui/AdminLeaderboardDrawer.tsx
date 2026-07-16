import { useEffect } from "react";
import { LeaderboardTable } from "../../../features/leaderboard/ui";

type AdminLeaderboardDrawerProps = {
  onClose: () => void;
};

export function AdminLeaderboardDrawer({ onClose }: AdminLeaderboardDrawerProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="admin-leaderboard-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="admin-leaderboard-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-leaderboard-title">
        <header>
          <div>
            <p>WYNIKI NA ŻYWO</p>
            <h2 id="admin-leaderboard-title">Tabela wyników</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij tabelę wyników"><span aria-hidden="true">×</span></button>
        </header>
        <div className="admin-leaderboard-drawer__content">
          <LeaderboardTable embedded />
        </div>
      </aside>
    </div>
  );
}
