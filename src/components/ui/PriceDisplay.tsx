
interface PriceDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accent?: 'green' | 'red' | 'default';
  showDash?: boolean; // If true, shows long dash instead of $0
}

export function PriceDisplay({ value, size = 'md', accent = 'default', showDash = true }: PriceDisplayProps) {
  // Guard against $0.00
  if (value === 0 && showDash) {
    return <span className={`text-${accent === 'default' ? 'text-muted' : `accent-${accent}`} opacity-70`}>—</span>;
  }

  const prefix = '$';
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <span className={`font-mono stat-${size} ${accent !== 'default' ? `text-${accent === 'green' ? 'accent-green' : 'accent-red'}` : ''}`}>
      <span className="opacity-70 text-[0.8em] mr-0.5">{prefix}</span>
      {formatted}
    </span>
  );
}
