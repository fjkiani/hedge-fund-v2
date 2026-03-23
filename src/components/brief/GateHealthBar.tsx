/**
 * GateHealthBar — Bottom row showing gate win rate, blocked/allowed ratio, avg R.
 * Shows "No tracked outcomes yet" when no data exists.
 */

interface GateHealth {
  win_rate_last_n: number;
  blocked_vs_allowed: string;
  avg_r_last_n: number;
  wins: number;
  losses: number;
}

interface GateHealthBarProps {
  gateHealth: GateHealth | null;
  gateHealthError: boolean;
}

export function GateHealthBar({ gateHealth, gateHealthError }: GateHealthBarProps) {
  const hasData = gateHealth && (gateHealth.wins + gateHealth.losses) > 0;

  return (
    <div className="gate-health">
      <span className="gate-health__label">Gate Health</span>
      {gateHealthError ? (
        <span className="gate-health__error">Unavailable</span>
      ) : gateHealth ? (
        hasData ? (
          <div className="gate-health__stats">
            <span className={`gate-health__wr ${gateHealth.win_rate_last_n >= 50 ? 'gate-health__wr--good' : 'gate-health__wr--bad'}`}>
              WR: {gateHealth.win_rate_last_n.toFixed(0)}%
            </span>
            <span className="gate-health__ratio">{gateHealth.blocked_vs_allowed}</span>
            <span className={`gate-health__r ${gateHealth.avg_r_last_n >= 0 ? 'gate-health__r--positive' : 'gate-health__r--negative'}`}>
              Avg: {gateHealth.avg_r_last_n.toFixed(2)}R
            </span>
          </div>
        ) : (
          <span className="gate-health__empty">No tracked outcomes yet — system building history</span>
        )
      ) : (
        <span className="gate-health__loading">Loading...</span>
      )}
    </div>
  );
}
