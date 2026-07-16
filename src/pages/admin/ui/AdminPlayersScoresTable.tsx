import type { AdminPlayer } from "../../../features/admin/model";
import { COUNTRIES, CountryFlag, isCountryCode } from "../../../shared/ui/country-flag";

type AdminPlayersScoresTableProps = {
  draftScores: Record<string, string>;
  onScoreChange: (playerId: string, score: string) => void;
  players: AdminPlayer[];
};

export function AdminPlayersScoresTable({ draftScores, onScoreChange, players }: AdminPlayersScoresTableProps) {
  return (
    <div className="admin-table-scroll">
      <table>
        <thead><tr><th>GRACZ</th><th>KRAJ</th><th>PUNKTY</th></tr></thead>
        <tbody>
          {players.map((player) => {
            const country = isCountryCode(player.teamName) ? player.teamName : null;
            return (
              <tr className={!player.name ? "is-pending" : undefined} key={player.id}>
                <td><strong>{player.name ?? "Jeszcze nie dołączył"}</strong></td>
                <td>
                  <div className="admin-team">
                    {country && <CountryFlag country={country} />}
                    <span>{country ? COUNTRIES[country].namePl : player.teamName}</span>
                  </div>
                </td>
                <td>
                  <input
                    aria-label={`Punkty: ${player.name ?? player.teamName}`}
                    type="number"
                    min="0"
                    step="1"
                    value={draftScores[player.id] ?? "0"}
                    onChange={(event) => onScoreChange(player.id, event.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
