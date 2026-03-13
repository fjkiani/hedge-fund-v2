/**
 * Squeeze Page — Short squeeze candidate scanner
 * Backend: GET /api/v1/squeeze/scan → OpportunityScanner
 */

import { SqueezeScanner } from '../components/widgets/SqueezeScanner';
import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';

export function Squeeze() {
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
            ⛔ THESIS INVALIDATED — squeeze candidates shown for reference only
          </div>
          {snapshot?.thesis_invalidation_reason && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.125rem' }}>
              {snapshot.thesis_invalidation_reason}
            </div>
          )}
        </div>
      )}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Squeeze Scanner
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(148, 163, 184, 0.8)', marginTop: '0.25rem' }}>
          High-conviction short squeeze candidates with dark pool support
        </p>
      </div>

      <SqueezeScanner minScore={55} maxResults={20} autoRefresh={true} />
    </main>
  );
}
