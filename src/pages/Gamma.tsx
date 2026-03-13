/**
 * Gamma Page — Gamma Exposure tracking via CBOE data
 * Backend: GET /api/v1/gamma/{symbol} → GEXCalculator
 */

import { useState } from 'react';
import { GammaTracker } from '../components/widgets/GammaTracker';
import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';

const SYMBOLS = ['SPY', 'QQQ', 'IWM'] as const;

export function Gamma() {
  const [symbol, setSymbol] = useState<string>('SPY');
  const { snapshot } = useIntradaySnapshot();
  const thesisValid = snapshot ? (snapshot.thesis_valid || !snapshot.market_open) : true;

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {!thesisValid && (
        <div style={{
          width: '100%', padding: '0.75rem 1.25rem', marginBottom: '1rem',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          border: '2px solid #ef4444', borderRadius: '0.75rem', color: '#fff',
          boxShadow: '0 0 20px rgba(220,38,38,0.25)',
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            ⛔ THESIS INVALIDATED — gamma data shown for reference only
          </div>
          {snapshot?.thesis_invalidation_reason && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.125rem' }}>
              {snapshot.thesis_invalidation_reason}
            </div>
          )}
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Gamma Exposure
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(148, 163, 184, 0.8)', marginTop: '0.25rem' }}>
            Real-time GEX from CBOE delayed options data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {SYMBOLS.map(s => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: symbol === s ? 600 : 400,
                background: symbol === s ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                border: symbol === s ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: symbol === s ? '#93c5fd' : 'rgba(148, 163, 184, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <GammaTracker symbol={symbol} autoRefresh={true} refreshInterval={30000} />
    </main>
  );
}
