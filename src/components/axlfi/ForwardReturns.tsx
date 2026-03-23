/**
 * Forward Returns Heatmap — SP500/NASDAQ100 forward returns by timeframe
 */
import { AXLFICard, pct } from './shared';

function retColor(val: number): string {
  if (val > 0.05) return '#00ff88';
  if (val > 0.02) return 'rgba(0,255,136,0.7)';
  if (val > 0) return 'rgba(0,255,136,0.4)';
  if (val > -0.02) return 'rgba(255,51,102,0.4)';
  if (val > -0.05) return 'rgba(255,51,102,0.7)';
  return '#ff3366';
}

export function ForwardReturns({ clusters }: { clusters: any }) {
  const data = clusters?.data || [];
  if (!data.length) return null;

  const sorted = [...data].sort((a: any, b: any) => (b['20d_forward_return'] || 0) - (a['20d_forward_return'] || 0));
  const top20 = sorted.slice(0, 20);

  return (
    <AXLFICard title="Forward Returns Heatmap (SP500)" icon="📊" className="col-span-full">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-1 px-2">Ticker</th>
              <th className="text-right py-1 px-2">Price</th>
              <th className="text-right py-1 px-2">1D</th>
              <th className="text-right py-1 px-2">2D</th>
              <th className="text-right py-1 px-2">5D</th>
              <th className="text-right py-1 px-2">10D</th>
              <th className="text-right py-1 px-2">20D</th>
            </tr>
          </thead>
          <tbody>
            {top20.map((item: any, i: number) => (
              <tr key={i} className="border-t border-border-subtle hover:bg-bg-hover transition-colors">
                <td className="py-1.5 px-2 font-bold text-text-primary">{item.ticker}</td>
                <td className="py-1.5 px-2 text-right text-text-secondary">${item.close?.toFixed(2)}</td>
                {['1d', '2d', '5d', '10d', '20d'].map(tf => {
                  const val = item[`${tf}_forward_return`] || 0;
                  return (
                    <td key={tf} className="py-1.5 px-2 text-right font-mono font-semibold" style={{ color: retColor(val) }}>
                      {pct(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-text-muted mt-2 text-right">
        Showing top 20 of {data.length} tickers by 20D forward return
      </div>
    </AXLFICard>
  );
}
