/**
 * IntensityBar — Animated fill bar with glow
 * Used to show signal intensity scores (0-100).
 */

interface IntensityBarProps {
  value: number;
  color?: string;
  label?: string;
}

export function IntensityBar({ value, color = '#22d3ee', label = 'Intensity' }: IntensityBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="intensity-bar">
      <div className="intensity-bar__header">
        <span className="intensity-bar__label">{label}</span>
        <span className="intensity-bar__value">{clamped}%</span>
      </div>
      <div className="intensity-bar__track">
        <div
          className="intensity-bar__fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}
