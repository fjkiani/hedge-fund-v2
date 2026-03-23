/**
 * IndexStrip — SPY/QQQ/IWM compact cards with 10-day DP sparklines.
 * Fetches DP position history from /axlfi/detail/{sym} on mount.
 */

import { useEffect, useState } from 'react';

interface IndexData {
  spy: {
    price: number;
    call_wall: number;
    delta_from_wall: number;
    close_defense: string;
    close_vol_ratio: number;
  };
  qqq: {
    call_wall: number;
    put_wall: number;
    sv_direction: string;
    sv_read: string;
  };
  iwm: {
    call_wall: number;
    put_wall: number;
  };
}

interface SparklineData {
  dates: string[];
  positions: number[];
}

interface IndexStripProps {
  brief: IndexData;
}

function Sparkline({ data, label }: { data: number[]; label: string }) {
  if (data.length === 0) {
    return <div className="index-card__sparkline-label">No DP data</div>;
  }

  const max = Math.max(...data.map(Math.abs), 1);

  return (
    <>
      <div className="index-card__sparkline">
        {data.slice(-10).map((v, i) => {
          const height = Math.max(2, (Math.abs(v) / max) * 20);
          const cls = v > 0 ? 'index-card__sparkline-bar--positive'
            : v < 0 ? 'index-card__sparkline-bar--negative'
            : 'index-card__sparkline-bar--zero';
          return (
            <div
              key={i}
              className={`index-card__sparkline-bar ${cls}`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
      <div className="index-card__sparkline-label">{label}</div>
    </>
  );
}

export function IndexStrip({ brief }: IndexStripProps) {
  const [sparklines, setSparklines] = useState<Record<string, SparklineData>>({});
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    async function loadSparklines() {
      const results: Record<string, SparklineData> = {};
      for (const sym of ['SPY', 'QQQ', 'IWM']) {
        try {
          const resp = await fetch(`${API_URL}/axlfi/detail/${sym}?window=10`);
          const data = await resp.json();
          const dp = data.individual_dark_pool_position_data || {};
          results[sym] = {
            dates: dp.dates || [],
            positions: dp.dollar_dp_position || [],
          };
        } catch {
          results[sym] = { dates: [], positions: [] };
        }
      }
      setSparklines(results);
    }
    loadSparklines();
  }, [API_URL]);

  const spyDelta = brief.spy.delta_from_wall;

  // Format sparkline label
  function getSparklineLabel(sym: string): string {
    const data = sparklines[sym];
    if (!data || data.positions.length === 0) return 'Loading...';
    const last = data.positions[data.positions.length - 1];
    const allZero = data.positions.every(v => v === 0);
    if (allZero) return 'No DP data for ETF';
    if (last > 0) return `DP: $${(last / 1e3).toFixed(0)}K (accumulating)`;
    if (last < 0) return `DP: -$${(Math.abs(last) / 1e3).toFixed(0)}K (distributing)`;
    return 'DP: Flat';
  }

  return (
    <div className="index-strip">
      {/* SPY */}
      <div className="index-card">
        <div className="index-card__header">
          <span className="index-card__symbol">SPY</span>
          <span className={`index-card__badge ${brief.spy.close_defense === 'DEFENDED' ? 'index-card__badge--green' : 'index-card__badge--neutral'}`}>
            {brief.spy.close_defense || 'N/A'}
          </span>
        </div>
        <div className="index-card__price">${brief.spy.price}</div>
        <div className="index-card__detail">
          Wall: ${brief.spy.call_wall} · {spyDelta > 0 ? '+' : ''}{spyDelta} {spyDelta > 0 ? 'above' : 'below'}
        </div>
        {brief.spy.close_vol_ratio != null && (
          <div className="index-card__sub">Close vol: {brief.spy.close_vol_ratio}x avg</div>
        )}
        <Sparkline
          data={sparklines['SPY']?.positions || []}
          label={getSparklineLabel('SPY')}
        />
      </div>

      {/* QQQ */}
      <div className="index-card">
        <div className="index-card__header">
          <span className="index-card__symbol">QQQ</span>
          <span className={`index-card__badge ${brief.qqq.sv_direction === 'RISING' ? 'index-card__badge--green' : brief.qqq.sv_direction === 'FALLING' ? 'index-card__badge--yellow' : 'index-card__badge--neutral'}`}>
            SV {brief.qqq.sv_direction || 'N/A'}
          </span>
        </div>
        <div className="index-card__walls">Call: ${brief.qqq.call_wall} · Put: ${brief.qqq.put_wall}</div>
        <div className="index-card__sv">{brief.qqq.sv_read}</div>
        <Sparkline
          data={sparklines['QQQ']?.positions || []}
          label={getSparklineLabel('QQQ')}
        />
      </div>

      {/* IWM */}
      <div className="index-card">
        <div className="index-card__header">
          <span className="index-card__symbol">IWM</span>
        </div>
        <div className="index-card__walls">Call: ${brief.iwm.call_wall} · Put: ${brief.iwm.put_wall}</div>
        <Sparkline
          data={sparklines['IWM']?.positions || []}
          label={getSparklineLabel('IWM')}
        />
      </div>
    </div>
  );
}
