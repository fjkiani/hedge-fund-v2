/**
 * ConvictionDisplay — SVG ring gauge for divergence boost score
 * Props come from report.divergence_boost (0-10 scale).
 */

interface ConvictionDisplayProps {
  score: number;
  maxScore?: number;
}

export function ConvictionDisplay({ score, maxScore = 10 }: ConvictionDisplayProps) {
  const clamped = Math.max(0, Math.min(maxScore, score));
  const circumference = 2 * Math.PI * 70; // r=70
  const offset = circumference - (circumference * (clamped / maxScore));

  // Color gradient: 0-3 = red, 4-6 = yellow, 7+ = green
  const ringColor = clamped >= 7 ? '#10b981' : clamped >= 4 ? '#f59e0b' : '#ef4444';

  return (
    <div className="conviction-display">
      <div className="conviction-display__ring">
        <svg viewBox="0 0 160 160" className="conviction-display__svg">
          {/* Background track */}
          <circle
            cx="80" cy="80" r="70"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Animated fill */}
          <circle
            cx="80" cy="80" r="70"
            stroke={ringColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="conviction-display__arc"
            style={{
              filter: `drop-shadow(0 0 12px ${ringColor})`,
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
          />
        </svg>
        <div className="conviction-display__center">
          <span className="conviction-display__score">+{clamped}</span>
          <span className="conviction-display__label">Conviction</span>
        </div>
      </div>
    </div>
  );
}
