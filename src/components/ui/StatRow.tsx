import { PriceDisplay } from './PriceDisplay';

interface StatItem {
  label: string;
  value: number | string;
  isPrice?: boolean;
  accent?: 'green' | 'red' | 'default';
}

interface StatRowProps {
  items: StatItem[];
  className?: string;
}

export function StatRow({ items, className = '' }: StatRowProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col">
          <span className="label-sm mb-1">{item.label}</span>
          {item.isPrice && typeof item.value === 'number' ? (
            <PriceDisplay value={item.value} size="md" accent={item.accent} />
          ) : (
            <span className={`stat-md ${item.accent === 'green' ? 'text-accent-green' : item.accent === 'red' ? 'text-accent-red' : 'text-text-primary'}`}>
              {item.value || '—'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
