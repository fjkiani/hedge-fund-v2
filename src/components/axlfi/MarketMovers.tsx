/**
 * Market Movers Widget — Volume spikes, price gainers/losers, sector rotation
 */
import { AXLFICard, fmt } from './shared';

export function MarketMovers({ movers }: { movers: any }) {
  if (!movers) return null;

  const sectors = movers.sector_leaders_1d || {};
  const volumeGainers = movers.top_volume_gainers || [];
  const priceGainers = movers.top_price_gainers || [];
  const priceLosers = movers.top_price_losers || [];

  return (
    <AXLFICard title="Market Movers" icon="🔥">
      {/* Sector Leaders */}
      {sectors.best_sector && (
        <div className="mb-4">
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Sector Rotation</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-primary">🟢 <span className="font-medium">{sectors.best_sector}</span></span>
            <span style={{ color: '#00ff88' }} className="text-xs font-semibold">+{((sectors.best_value || 0) * 100).toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-text-primary">🔴 <span className="font-medium">{sectors.worst_sector}</span></span>
            <span style={{ color: '#ff3366' }} className="text-xs font-semibold">{((sectors.worst_value || 0) * 100).toFixed(2)}%</span>
          </div>
        </div>
      )}

      {/* Volume Spikes */}
      {volumeGainers.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Top Volume</div>
          <div className="space-y-1">
            {volumeGainers.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">{item.ticker || item.symbol}</span>
                <span className="text-accent-blue text-xs">{fmt(item.current_volume || item.volume || 0, 0)} vol</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Gainers */}
      {priceGainers.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Top Gainers</div>
          <div className="space-y-1">
            {priceGainers.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">{item.ticker || item.symbol}</span>
                <span style={{ color: '#00ff88' }} className="text-xs font-semibold">
                  +{(item.change_pct || item.pct_change || 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Losers */}
      {priceLosers.length > 0 && (
        <div>
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Top Losers</div>
          <div className="space-y-1">
            {priceLosers.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">{item.ticker || item.symbol}</span>
                <span style={{ color: '#ff3366' }} className="text-xs font-semibold">
                  {(item.change_pct || item.pct_change || 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AXLFICard>
  );
}
