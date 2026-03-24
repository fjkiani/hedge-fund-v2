import type { MasterBrief } from '../../../../hooks/useMasterBrief';
import { useOracle } from '../../OracleContext';
import { OracleRead } from '../OracleRead';

export function HiddenHandsPanel({ data }: { data: MasterBrief }) {
  const hh     = data.hidden_hands;
  const oracle = useOracle();
  if (!hh || hh.error) return (
    <div className="mb-panel mb-panel--hh mb-panel--full">
      <div className="mb-panel__error">Hidden Hands unavailable</div>
    </div>
  );

  return (
    <div className="mb-panel mb-panel--hh mb-panel--full">
      <div className="mb-panel__title">🕵️ HIDDEN HANDS</div>
      <div className="mb-hh-grid">
        <div className="mb-hh-section">
          <div className="mb-hh-stat">
            <span className="mb-hh-stat__value">{hh.politician_cluster}</span>
            <span className="mb-hh-stat__label">POLITICIAN TRADES</span>
          </div>
          {hh.hot_tickers?.length > 0 && (
            <div className="mb-hh-tickers">
              {hh.hot_tickers.map(t => <span key={t} className="mb-hh-ticker">{t}</span>)}
            </div>
          )}
        </div>
        <div className="mb-hh-section">
          <div className="mb-hh-stat">
            <span className={`mb-hh-stat__value ${(hh.insider_net_usd || 0) < 0 ? 'mb-metric--hot' : 'mb-metric--cool'}`}>
              ${hh.insider_net_usd ? (hh.insider_net_usd / 1e6).toFixed(1) + 'M' : '0'}
            </span>
            <span className="mb-hh-stat__label">INSIDER NET</span>
          </div>
          <div className="mb-hh-stat">
            <span className="mb-hh-stat__value">{hh.spouse_alerts}</span>
            <span className="mb-hh-stat__label">SPOUSE ALERTS</span>
          </div>
        </div>
        <div className="mb-hh-section">
          <div className="mb-hh-stat">
            <span className="mb-hh-stat__value">{hh.fed_tone}</span>
            <span className="mb-hh-stat__label">FED TONE</span>
          </div>
          <div className="mb-hh-fed-counts">
            <span className="mb-hh-hawk">🦅 {hh.hawk_count}</span>
            <span className="mb-hh-dove">🕊️ {hh.dove_count}</span>
          </div>
          {hh.divergence_boost > 0 && <div className="mb-hh-boost">+{hh.divergence_boost} BOOST</div>}
        </div>
      </div>
      {hh.top_divergence && <div className="mb-hh-divergence">{hh.top_divergence}</div>}
      <OracleRead section={oracle?.sections?.hidden_hands} />
    </div>
  );
}
