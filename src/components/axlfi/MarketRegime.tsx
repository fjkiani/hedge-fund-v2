/**
 * Market Regime Widget — VIX tier display (1-4)
 */
import { AXLFICard, TIER_COLORS, TIER_LABELS } from './shared';

export function MarketRegime({ regime }: { regime: any }) {
  if (!regime) {
    return (
      <AXLFICard title="Market Regime" icon="🌡️">
        <div className="text-center py-4">
          <span className="text-text-muted text-sm">No Active Regime Alert</span>
        </div>
      </AXLFICard>
    );
  }

  const tier = regime.current_regime || 1;
  const color = TIER_COLORS[tier] || '#00d4ff';
  const label = regime.tier_label || TIER_LABELS[tier] || 'UNKNOWN';

  return (
    <AXLFICard title="Market Regime" icon="🌡️">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold" style={{ color }}>{label}</div>
          <div className="text-text-muted text-xs mt-1">
            Regime {tier} • {regime.date ? new Date(regime.date).toLocaleDateString() : '—'}
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(t => (
            <div
              key={t}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: t === tier ? TIER_COLORS[t] : 'rgba(255,255,255,0.05)',
                color: t === tier ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                boxShadow: t === tier ? `0 0 12px ${TIER_COLORS[t]}40` : 'none',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </AXLFICard>
  );
}
