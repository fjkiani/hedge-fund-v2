/**
 * SignalPills — Bullish/bearish signal breakdown pills.
 */

interface Signal {
  bias: string;
  reason: string;
}

interface SignalPillsProps {
  signals: Signal[];
}

export function SignalPills({ signals }: SignalPillsProps) {
  if (signals.length === 0) return null;

  return (
    <div className="signal-pills">
      {signals.map((s, i) => {
        const cls = s.bias === 'BULLISH' ? 'signal-pill--bullish'
          : s.bias === 'BEARISH' ? 'signal-pill--bearish'
          : 'signal-pill--mixed';
        const icon = s.bias === 'BULLISH' ? '▲' : s.bias === 'BEARISH' ? '▼' : '◆';
        return (
          <div key={i} className={`signal-pill ${cls}`}>
            {icon} {s.reason}
          </div>
        );
      })}
    </div>
  );
}
