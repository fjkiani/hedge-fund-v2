/**
 * OI Distribution — Weapon 3
 *
 * Calls /option-walls/{sym} for the full strike-level data.
 * Renders x_values vs y_call_values (green) / y_put_values (red) as bar chart.
 * This is the gamma exposure profile.
 */

import { useEffect, useState } from 'react';
import { axlfiApi } from '../../lib/api';
import { AXLFICard } from './shared';

const SYMBOLS = ['SPY', 'QQQ', 'IWM'] as const;

export function OIDistribution() {
  const [sym, setSym] = useState<string>('SPY');
  const [wallData, setWallData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expIdx, setExpIdx] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    axlfiApi
      .optionWalls(sym)
      .then((data: any) => {
        if (mounted) {
          setWallData(data);
          setExpIdx(0);
        }
      })
      .catch((e: any) => {
        if (mounted) setErr(e.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [sym]);

  if (loading) {
    return (
      <AXLFICard title="Option Wall Distribution" icon="🏗️">
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center' }}>
          Loading {sym} option walls...
        </p>
      </AXLFICard>
    );
  }

  if (err || !wallData) {
    return (
      <AXLFICard title="Option Wall Distribution" icon="🏗️">
        <p style={{ color: 'var(--accent-orange)', fontSize: '0.75rem' }}>
          ⚠️ {err || 'No wall data'}
        </p>
      </AXLFICard>
    );
  }

  const expirations = wallData.expirations || [];
  const walls = wallData.option_walls || {};
  const selectedExp = expirations[expIdx] || '';
  const expData = walls[selectedExp] || {};

  const strikes: number[] = expData.x_values || [];
  const callOI: number[] = expData.y_call_values || [];
  const putOI: number[] = expData.y_put_values || [];
  const callWall = expData.call_wall;
  const putWall = expData.put_wall;
  const poc = expData.poc;

  if (!strikes.length) {
    return (
      <AXLFICard title="Option Wall Distribution" icon="🏗️">
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          No strike data for {sym} exp {selectedExp}
        </p>
      </AXLFICard>
    );
  }

  // Find max OI for scaling
  const maxOI = Math.max(
    ...callOI.map(Math.abs),
    ...putOI.map(Math.abs),
    1
  );

  // Chart dimensions
  const BAR_H = 3;
  const GAP = 1;
  const W = 700;
  const LABEL_W = 40;
  const BAR_AREA = W - LABEL_W * 2;
  const H = strikes.length * (BAR_H + GAP) + 30;

  return (
    <AXLFICard title="Option Wall Distribution — Gamma Exposure" icon="🏗️">
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Symbol selector */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSym(s)}
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.7rem',
                fontWeight: sym === s ? 700 : 400,
                background: sym === s ? 'var(--accent-blue)' : 'transparent',
                color: sym === s ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Expiration selector */}
        <select
          value={expIdx}
          onChange={(e) => setExpIdx(Number(e.target.value))}
          style={{
            padding: '0.2rem 0.4rem',
            fontSize: '0.7rem',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 4,
          }}
        >
          {expirations.map((exp: string, i: number) => (
            <option key={exp} value={i}>
              {exp}
            </option>
          ))}
        </select>

        {/* Wall levels */}
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem' }}>
          {putWall && <span style={{ color: 'var(--accent-red)' }}>Put Wall: ${putWall}</span>}
          {poc && <span style={{ color: 'var(--accent-blue)' }}>POC: ${poc}</span>}
          {callWall && <span style={{ color: 'var(--accent-green)' }}>Call Wall: ${callWall}</span>}
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 400 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', minHeight: 200, maxHeight: 400 }}
          preserveAspectRatio="xMidYMin meet"
        >
          {/* Center line */}
          <line
            x1={LABEL_W + BAR_AREA / 2}
            y1={0}
            x2={LABEL_W + BAR_AREA / 2}
            y2={H - 20}
            stroke="var(--border-primary)"
            strokeWidth={0.5}
          />

          {strikes.map((strike, i) => {
            const yPos = i * (BAR_H + GAP);
            const centerX = LABEL_W + BAR_AREA / 2;
            const callW = (Math.abs(callOI[i] || 0) / maxOI) * (BAR_AREA / 2);
            const putW = (Math.abs(putOI[i] || 0) / maxOI) * (BAR_AREA / 2);

            const isCallWall = strike === callWall;
            const isPutWall = strike === putWall;
            const isPOC = strike === poc;

            return (
              <g key={strike}>
                {/* Put bar (left, red) */}
                <rect
                  x={centerX - putW}
                  y={yPos}
                  width={putW}
                  height={BAR_H}
                  fill={isPutWall ? '#ef4444' : 'rgba(239,68,68,0.5)'}
                />
                {/* Call bar (right, green) */}
                <rect
                  x={centerX}
                  y={yPos}
                  width={callW}
                  height={BAR_H}
                  fill={isCallWall ? '#22c55e' : 'rgba(34,197,94,0.5)'}
                />
                {/* POC marker */}
                {isPOC && (
                  <line
                    x1={LABEL_W}
                    y1={yPos + BAR_H / 2}
                    x2={LABEL_W + BAR_AREA}
                    y2={yPos + BAR_H / 2}
                    stroke="var(--accent-blue)"
                    strokeWidth={0.8}
                    strokeDasharray="3,3"
                  />
                )}
                {/* Strike label — show every 5th or key strikes */}
                {(i % 5 === 0 || isCallWall || isPutWall || isPOC) && (
                  <>
                    <text
                      x={LABEL_W - 4}
                      y={yPos + BAR_H}
                      fontSize={6}
                      fill={
                        isPOC
                          ? 'var(--accent-blue)'
                          : isCallWall
                          ? 'var(--accent-green)'
                          : isPutWall
                          ? 'var(--accent-red)'
                          : 'var(--text-tertiary)'
                      }
                      textAnchor="end"
                      fontWeight={isCallWall || isPutWall || isPOC ? 700 : 400}
                    >
                      {strike}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Labels */}
          <text x={LABEL_W + BAR_AREA / 4} y={H - 5} fontSize={8} fill="var(--accent-red)" textAnchor="middle">
            ← PUT OI
          </text>
          <text x={LABEL_W + (BAR_AREA * 3) / 4} y={H - 5} fontSize={8} fill="var(--accent-green)" textAnchor="middle">
            CALL OI →
          </text>
        </svg>
      </div>
    </AXLFICard>
  );
}
