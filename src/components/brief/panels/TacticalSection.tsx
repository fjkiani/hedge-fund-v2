/**
 * TacticalSection — HiddenHandsPanel (full-width) + [DerivativesPanel + KillChainPanel] (2-col)
 * All panels read oracle slices via useOracle() — no direct Groq calls.
 */
import type { MasterBrief } from '../../../hooks/useMasterBrief';
import { useOracle } from '../OracleContext';

// ── Oracle NYX read helper ────────────────────────────────────────────────────
function OracleRead({ section }: { section: { summary: string | null; confidence: number | null } | null | undefined }) {
  if (!section?.summary) return null;
  return (
    <div className="mb-oracle-read">
      <span className="mb-oracle-read__label">NYX:</span>
      <span className="mb-oracle-read__text">{section.summary}</span>
      {section.confidence != null && (
        <span className="mb-oracle-read__conf">{Math.round(section.confidence * 100)}%</span>
      )}
    </div>
  );
}

// ── Hidden Hands ──────────────────────────────────────────────────────────────
function HiddenHandsPanel({ data }: { data: MasterBrief }) {
  const hh = data.hidden_hands;
  const oracle = useOracle();
  if (!hh || hh.error) return <div className="mb-panel mb-panel--hh mb-panel--full"><div className="mb-panel__error">Hidden Hands unavailable</div></div>;

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

// ── Derivatives ───────────────────────────────────────────────────────────────
function DerivativesPanel({ data }: { data: MasterBrief }) {
  const d = data.derivatives;
  const oracle = useOracle();
  if (!d || d.error) return <div className="mb-panel mb-panel--deriv"><div className="mb-panel__error">Derivatives unavailable</div></div>;

  const isNegGamma = d.gex_regime?.toUpperCase().includes('NEGATIVE');

  return (
    <div className="mb-panel mb-panel--deriv">
      <div className="mb-panel__title">📉 DERIVATIVES</div>
      <div className="mb-deriv-grid">
        <div className="mb-metric">
          <span className="mb-metric__label">GEX Regime</span>
          <span className={`mb-metric__value ${isNegGamma ? 'mb-metric--hot' : 'mb-metric--cool'}`}>
            {d.gex_regime || 'N/A'}
          </span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Total GEX</span>
          <span className="mb-metric__value">{d.total_gex ? (d.total_gex / 1e6).toFixed(1) + 'M' : 'N/A'}</span>
        </div>
        {d.put_wall && <div className="mb-metric"><span className="mb-metric__label">Put Wall</span><span className="mb-metric__value">${d.put_wall}</span></div>}
        {d.call_wall && <div className="mb-metric"><span className="mb-metric__label">Call Wall</span><span className="mb-metric__value">${d.call_wall}</span></div>}
        {d.spot > 0 && <div className="mb-metric"><span className="mb-metric__label">SPY Spot</span><span className="mb-metric__value">${d.spot?.toFixed(2)}</span></div>}
      </div>
      {d.cot_spec_net !== undefined && (
        <div className="mb-cot-strip">
          <span className="mb-cot-label">COT ES Specs:</span>
          <span className={`mb-cot-value ${d.cot_spec_net! < 0 ? 'mb-metric--cold' : 'mb-metric--hot'}`}>
            {d.cot_spec_net?.toLocaleString()} {d.cot_spec_side}
          </span>
          {d.cot_divergent && <span className="mb-cot-div">⚠️ DIVERGENT</span>}
          {d.cot_trap && <span className="mb-cot-trap">{d.cot_trap}</span>}
        </div>
      )}
      <OracleRead section={oracle?.sections?.derivatives} />
    </div>
  );
}

// ── Kill Chain ────────────────────────────────────────────────────────────────
function KillChainPanel({ data }: { data: MasterBrief }) {
  const kc = data.kill_chain_state;
  const oracle = useOracle();
  if (!kc || kc.error) return <div className="mb-panel mb-panel--kc"><div className="mb-panel__error">Kill Chain unavailable</div></div>;

  const alertColor = ({ RED: '#ef4444', YELLOW: '#eab308', GREEN: '#22c55e', ORANGE: '#f97316' } as Record<string, string>)[kc.alert_level] || '#64748b';

  return (
    <div className="mb-panel mb-panel--kc">
      <div className="mb-panel__title">⚔️ KILL CHAIN</div>
      <div className="mb-kc-grid">
        <div className="mb-metric">
          <span className="mb-metric__label">Alert Level</span>
          <span className="mb-metric__value" style={{ color: alertColor }}>{kc.alert_level || 'UNKNOWN'}</span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Layers Active</span>
          <span className="mb-metric__value">{kc.layers_active}/5</span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Confidence Cap</span>
          <span className="mb-metric__value" style={{ color: kc.confidence_cap <= 35 ? '#ef4444' : kc.confidence_cap <= 55 ? '#eab308' : '#22c55e' }}>
            {kc.confidence_cap}%
          </span>
        </div>
        {kc.cap_reason && <div className="mb-metric"><span className="mb-metric__label">Cap Reason</span><span className="mb-metric__value mb-metric--small">{kc.cap_reason}</span></div>}
        {kc.regime_modifier !== 0 && <div className="mb-metric"><span className="mb-metric__label">Regime Mod</span><span className="mb-metric__value mb-metric--hot">{kc.regime_modifier}%</span></div>}
        {kc.mismatches_count > 0 && <div className="mb-metric"><span className="mb-metric__label">Mismatches</span><span className="mb-metric__value mb-metric--hot">{kc.mismatches_count}</span></div>}
      </div>
      {kc.narrative && <div className="mb-kc-narrative">{kc.narrative}</div>}
      {/* Oracle NYX read — primary source per production rule */}
      <OracleRead section={oracle?.sections?.kill_chain} />
    </div>
  );
}

// ── Section export ────────────────────────────────────────────────────────────
export function TacticalSection({ data }: { data: MasterBrief }) {
  return (
    <>
      <HiddenHandsPanel data={data} />
      <div className="mb-row mb-row--2col">
        <DerivativesPanel data={data} />
        <KillChainPanel data={data} />
      </div>
    </>
  );
}
