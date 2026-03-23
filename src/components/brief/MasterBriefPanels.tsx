/**
 * 🎯 Master Brief Panels — Unified Intelligence Surface
 * 
 * 6-panel layout showing all 9 data layers on one surface:
 *   1. Alert banner strip (priority-sorted)
 *   2. Status bar (regime, next event, cap)
 *   3. Regime + Fed Path + Economic Edge (3-col row)
 *   4. Hidden Hands (full width)
 *   5. Derivatives + Kill Chain State (2-col row)
 */

import { useMasterBrief, type MasterBrief, type MasterBriefAlert } from '../../hooks/useMasterBrief';
import { useOracleBrief } from '../../hooks/useOracleBrief';
import { OracleContext } from './OracleContext';
import { OracleBriefStrip } from './panels/OracleBriefStrip';
import './MasterBriefPanels.css';

function AlertBanner({ alerts }: { alerts: MasterBriefAlert[] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="mb-alerts">
      {alerts.map((a, i) => (
        <div key={i} className={`mb-alert mb-alert--${a.priority.toLowerCase()}`}>
          <span className="mb-alert__icon">
            {a.priority === 'CRITICAL' ? '🚨' : a.priority === 'HIGH' ? '⚡' : '📊'}
          </span>
          <span className="mb-alert__type">{a.type.replace(/_/g, ' ')}</span>
          <span className="mb-alert__detail">
            {a.event && <strong>{a.event}</strong>}
            {a.signal && ` → ${a.signal}`}
            {a.edge && ` — ${a.edge}`}
            {a.hours !== undefined && ` (${a.hours}h)`}
          </span>
          {a.action && <span className="mb-alert__action">{a.action}</span>}
        </div>
      ))}
    </div>
  );
}

function StatusBar({ data }: { data: MasterBrief }) {
  const regime = data.macro_regime?.regime || 'UNKNOWN';
  const veto = data.economic_veto || {};
  const cap = data.kill_chain_state?.confidence_cap || 65;

  const regimeColor = {
    'STAGFLATION': '#ef4444', 'RECESSION': '#f97316', 'OVERHEATING': '#eab308',
    'GOLDILOCKS': '#22c55e', 'DEFLATIONARY_BUST': '#8b5cf6', 'NEUTRAL': '#64748b'
  }[regime] || '#64748b';

  const tierColor = {
    'BLOCKED': '#ef4444', 'HIGH_RISK': '#f97316', 'RISK': '#eab308',
    'AWARENESS': '#3b82f6', 'NORMAL': '#22c55e'
  }[veto.tier || 'NORMAL'] || '#64748b';

  return (
    <div className="mb-status-bar">
      <div className="mb-status-item" style={{ borderLeft: `3px solid ${regimeColor}` }}>
        <span className="mb-status-label">MACRO REGIME</span>
        <span className="mb-status-value" style={{ color: regimeColor }}>{regime}</span>
      </div>
      <div className="mb-status-item" style={{ borderLeft: `3px solid ${tierColor}` }}>
        <span className="mb-status-label">NEXT EVENT</span>
        <span className="mb-status-value">
          {veto.next_event || 'None'} {veto.hours_away != null ? `${veto.hours_away}h` : ''}
        </span>
      </div>
      <div className="mb-status-item">
        <span className="mb-status-label">CONFIDENCE CAP</span>
        <span className="mb-status-value" style={{ color: cap <= 35 ? '#ef4444' : cap <= 55 ? '#eab308' : '#22c55e' }}>
          {cap}%
        </span>
      </div>
      <div className="mb-status-item">
        <span className="mb-status-label">SCAN</span>
        <span className="mb-status-value">{data.scan_time}s</span>
      </div>
    </div>
  );
}

function RegimePanel({ data }: { data: MasterBrief }) {
  const mr = data.macro_regime;
  if (!mr || mr.error) return <div className="mb-panel mb-panel--regime"><div className="mb-panel__error">Regime unavailable</div></div>;

  return (
    <div className="mb-panel mb-panel--regime">
      <div className="mb-panel__title">📡 REGIME</div>
      <div className="mb-regime-grid">
        <div className="mb-metric">
          <span className="mb-metric__label">Inflation Score</span>
          <span className={`mb-metric__value ${mr.inflation_score > 0.5 ? 'mb-metric--hot' : 'mb-metric--cool'}`}>
            {mr.inflation_score?.toFixed(3)}
          </span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Growth Score</span>
          <span className={`mb-metric__value ${mr.growth_score < 0 ? 'mb-metric--cold' : 'mb-metric--cool'}`}>
            {mr.growth_score?.toFixed(3)}
          </span>
        </div>
        {mr.modifier?.long_penalty !== 0 && (
          <div className="mb-metric">
            <span className="mb-metric__label">LONG Penalty</span>
            <span className="mb-metric__value mb-metric--hot">{mr.modifier.long_penalty}%</span>
          </div>
        )}
        {mr.modifier?.short_penalty !== 0 && (
          <div className="mb-metric">
            <span className="mb-metric__label">SHORT Penalty</span>
            <span className="mb-metric__value mb-metric--cold">{mr.modifier.short_penalty}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FedPathPanel({ data }: { data: MasterBrief }) {
  const fi = data.fed_intelligence;
  if (!fi || fi.error) return <div className="mb-panel mb-panel--fed"><div className="mb-panel__error">FedWatch unavailable</div></div>;

  const rp = fi.rate_path;
  const path = fi.full_path || [];

  return (
    <div className="mb-panel mb-panel--fed">
      <div className="mb-panel__title">🏛️ FED PATH</div>
      <div className="mb-fed-rate">
        <span className="mb-fed-rate__range">{rp.current_range?.join('–')}%</span>
        <span className="mb-fed-rate__next">{rp.next_meeting} ({rp.days_away}d)</span>
      </div>
      <div className="mb-fed-path-grid">
        {path.slice(0, 4).map((m, i) => (
          <div key={i} className="mb-fed-meeting">
            <span className="mb-fed-meeting__label">{m.label?.split(' ')[0]}</span>
            <div className="mb-fed-probs">
              {m.p_hike_25 > 0 && <span className="mb-prob mb-prob--hike">↑{m.p_hike_25}%</span>}
              <span className="mb-prob mb-prob--hold">={m.p_hold}%</span>
              {m.p_cut_25 > 0 && <span className="mb-prob mb-prob--cut">↓{m.p_cut_25}%</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-fed-terminal">
        Terminal: {rp.terminal_bps > 0 ? '+' : ''}{rp.terminal_bps}bps
        {rp.regime_multiplier > 1 && <span className="mb-fed-multiplier"> ×{rp.regime_multiplier}</span>}
      </div>
    </div>
  );
}

function EconomicEdgePanel({ data }: { data: MasterBrief }) {
  const nowcast = data.nowcast;
  const thresholds = data.dynamic_thresholds || {};
  const veto = data.economic_veto;

  return (
    <div className="mb-panel mb-panel--economic">
      <div className="mb-panel__title">📈 ECONOMIC EDGE</div>

      {/* Nowcast pre-signals */}
      {nowcast && !nowcast.error && (
        <div className="mb-nowcast">
          <div className="mb-nowcast__title">Cleveland Fed Nowcast</div>
          <div className="mb-nowcast-grid">
            {nowcast.cpi_mom != null && (
              <div className="mb-nowcast-item">
                <span className="mb-nowcast-item__label">CPI MoM</span>
                <span className="mb-nowcast-item__value">{nowcast.cpi_mom}%</span>
              </div>
            )}
            {nowcast.pce_mom != null && (
              <div className="mb-nowcast-item">
                <span className="mb-nowcast-item__label">PCE MoM</span>
                <span className="mb-nowcast-item__value">{nowcast.pce_mom}%</span>
              </div>
            )}
            {nowcast.cpi_yoy != null && (
              <div className="mb-nowcast-item">
                <span className="mb-nowcast-item__label">CPI YoY</span>
                <span className="mb-nowcast-item__value">{nowcast.cpi_yoy}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic thresholds */}
      {Object.keys(thresholds).length > 0 && (
        <div className="mb-thresholds">
          <div className="mb-thresholds__title">Dynamic Thresholds</div>
          {Object.entries(thresholds).map(([key, t]) => (
            <div key={key} className="mb-threshold-row">
              <span className="mb-threshold-row__name">{key.replace(/_/g, ' ').toUpperCase()}</span>
              <span className="mb-threshold-band">
                <span className="mb-tb--cold">{t.COLD}</span>
                <span className="mb-tb--cons">{t.consensus}</span>
                <span className="mb-tb--hot">{t.HOT}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming critical events */}
      {veto?.upcoming_critical && veto.upcoming_critical.length > 0 && (
        <div className="mb-upcoming">
          {veto.upcoming_critical.slice(0, 3).map((ev, i) => (
            <div key={i} className="mb-upcoming-event">
              <span className="mb-upcoming-event__name">{ev.event}</span>
              <span className="mb-upcoming-event__date">{ev.date?.split(' ').slice(0, 3).join(' ')} {ev.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreSignalPanel({ data }: { data: MasterBrief }) {
  const adp = data.adp_prediction;
  const gdp = data.gdp_nowcast;

  // Hide panel if both are missing or errored or in-line with tiny delta
  const adpVisible = adp && !adp.error && adp.signal !== 'IN_LINE';
  const gdpVisible = gdp && !gdp.error && gdp.signal !== 'IN_LINE';
  if (!adpVisible && !gdpVisible) return null;

  const signalColor = (sig: string) =>
    sig === 'MISS_LIKELY' || sig === 'MISS' ? '#ef4444'
    : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '#22c55e'
    : '#64748b';

  const signalIcon = (sig: string) =>
    sig === 'MISS_LIKELY' || sig === 'MISS' ? '🔴'
    : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '🟢'
    : '🟡';

  const fmt = (n: number) => n >= 0 ? `+${n.toLocaleString()}` : n.toLocaleString();

  return (
    <div className="mb-panel mb-panel--presignal mb-panel--full">
      <div className="mb-panel__title">⚡ PRE-SIGNAL INTELLIGENCE</div>
      <div className="mb-presignal-grid">

        {adpVisible && (
          <div className="mb-presignal-card">
            <div className="mb-presignal-card__header">
              <span className="mb-presignal-card__icon">{signalIcon(adp!.signal)}</span>
              <span className="mb-presignal-card__name">ADP EMPLOYMENT</span>
              <span className="mb-presignal-card__signal" style={{ color: signalColor(adp!.signal) }}>
                {adp!.signal.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="mb-presignal-metrics">
              <div className="mb-psm">
                <span className="mb-psm__label">Model</span>
                <span className="mb-psm__value">{adp!.prediction?.toLocaleString()}</span>
              </div>
              <div className="mb-psm">
                <span className="mb-psm__label">Consensus</span>
                <span className="mb-psm__value">{adp!.consensus?.toLocaleString()}</span>
              </div>
              <div className="mb-psm">
                <span className="mb-psm__label">Delta</span>
                <span className="mb-psm__value" style={{ color: signalColor(adp!.signal) }}>
                  {adp!.delta != null ? fmt(adp!.delta) : '—'}
                </span>
              </div>
              <div className="mb-psm">
                <span className="mb-psm__label">Confidence</span>
                <span className="mb-psm__value">{adp!.confidence != null ? `${Math.round(adp!.confidence * 100)}%` : '—'}</span>
              </div>
            </div>
            {adp!.reasons && adp!.reasons.length > 0 && (
              <div className="mb-presignal-reasons">
                {adp!.reasons.map((r, i) => (
                  <div key={i} className="mb-presignal-reason">· {r}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {gdpVisible && (
          <div className="mb-presignal-card">
            <div className="mb-presignal-card__header">
              <span className="mb-presignal-card__icon">{signalIcon(gdp!.signal)}</span>
              <span className="mb-presignal-card__name">GDP NOWCAST Q1</span>
              <span className="mb-presignal-card__signal" style={{ color: signalColor(gdp!.signal) }}>
                {gdp!.signal}
              </span>
            </div>
            <div className="mb-presignal-metrics">
              <div className="mb-psm">
                <span className="mb-psm__label">GDPNow</span>
                <span className="mb-psm__value">{gdp!.gdp_estimate}%</span>
              </div>
              <div className="mb-psm">
                <span className="mb-psm__label">Consensus</span>
                <span className="mb-psm__value">{gdp!.consensus}%</span>
              </div>
              <div className="mb-psm">
                <span className="mb-psm__label">Delta</span>
                <span className="mb-psm__value" style={{ color: signalColor(gdp!.signal) }}>
                  {gdp!.vs_consensus != null ? `${gdp!.vs_consensus > 0 ? '+' : ''}${gdp!.vs_consensus?.toFixed(2)}pp` : '—'}
                </span>
              </div>
              <div className="mb-psm">
                <span className="mb-psm__label">Source</span>
                <span className="mb-psm__value mb-psm__value--small">Atlanta Fed</span>
              </div>
            </div>
            <div className="mb-presignal-reasons">
              <div className="mb-presignal-reason">· {gdp!.edge}</div>
            </div>
          </div>
        )}

      </div>
      {adp?.as_of && (
        <div className="mb-presignal-footer">Updated: {new Date(adp.as_of + 'Z').toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true })} ET</div>
      )}
    </div>
  );
}

function HiddenHandsPanel({ data }: { data: MasterBrief }) {
  const hh = data.hidden_hands;
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
          {hh.hot_tickers && hh.hot_tickers.length > 0 && (
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
          {hh.divergence_boost > 0 && (
            <div className="mb-hh-boost">+{hh.divergence_boost} BOOST</div>
          )}
        </div>
      </div>
      {hh.top_divergence && (
        <div className="mb-hh-divergence">{hh.top_divergence}</div>
      )}
    </div>
  );
}

function DerivativesPanel({ data }: { data: MasterBrief }) {
  const d = data.derivatives;
  if (!d || d.error) return <div className="mb-panel mb-panel--deriv"><div className="mb-panel__error">Derivatives unavailable</div></div>;

  const isNegGamma = d.gex_regime && d.gex_regime.toUpperCase().includes('NEGATIVE');

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
        {d.put_wall && (
          <div className="mb-metric">
            <span className="mb-metric__label">Put Wall</span>
            <span className="mb-metric__value">${d.put_wall}</span>
          </div>
        )}
        {d.call_wall && (
          <div className="mb-metric">
            <span className="mb-metric__label">Call Wall</span>
            <span className="mb-metric__value">${d.call_wall}</span>
          </div>
        )}
        {d.spot > 0 && (
          <div className="mb-metric">
            <span className="mb-metric__label">SPY Spot</span>
            <span className="mb-metric__value">${d.spot?.toFixed(2)}</span>
          </div>
        )}
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
    </div>
  );
}

function KillChainPanel({ data }: { data: MasterBrief }) {
  const kc = data.kill_chain_state;
  if (!kc || kc.error) return <div className="mb-panel mb-panel--kc"><div className="mb-panel__error">Kill Chain unavailable</div></div>;

  const alertColor = {
    'RED': '#ef4444', 'YELLOW': '#eab308', 'GREEN': '#22c55e', 'ORANGE': '#f97316'
  }[kc.alert_level] || '#64748b';

  return (
    <div className="mb-panel mb-panel--kc">
      <div className="mb-panel__title">⚔️ KILL CHAIN</div>
      <div className="mb-kc-grid">
        <div className="mb-metric">
          <span className="mb-metric__label">Alert Level</span>
          <span className="mb-metric__value" style={{ color: alertColor }}>
            {kc.alert_level || 'UNKNOWN'}
          </span>
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
        {kc.cap_reason && (
          <div className="mb-metric">
            <span className="mb-metric__label">Cap Reason</span>
            <span className="mb-metric__value mb-metric--small">{kc.cap_reason}</span>
          </div>
        )}
        {kc.regime_modifier !== 0 && (
          <div className="mb-metric">
            <span className="mb-metric__label">Regime Mod</span>
            <span className="mb-metric__value mb-metric--hot">{kc.regime_modifier}%</span>
          </div>
        )}
        {kc.mismatches_count > 0 && (
          <div className="mb-metric">
            <span className="mb-metric__label">Mismatches</span>
            <span className="mb-metric__value mb-metric--hot">{kc.mismatches_count}</span>
          </div>
        )}
      </div>
      {kc.narrative && (
        <div className="mb-kc-narrative">{kc.narrative}</div>
      )}
    </div>
  );
}

export function MasterBriefPanels() {
  const { data, loading, error } = useMasterBrief(120000);
  const { oracle } = useOracleBrief(data);

  if (loading) return (
    <div className="mb-loading">
      <div className="mb-loading__spinner" />
      <span>Loading unified intelligence...</span>
    </div>
  );

  if (error || !data) return (
    <div className="mb-error">
      <span className="mb-error__icon">⚠️</span>
      <span>Master Brief unavailable: {error || 'No data'}</span>
    </div>
  );

  return (
    <OracleContext.Provider value={oracle}>
      <div className="mb-container">
        <div className="mb-header">
          <span className="mb-header__title">🎯 UNIFIED INTELLIGENCE</span>
          <span className="mb-header__time">{new Date(data.as_of + (data.as_of.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true })} ET</span>
        </div>

        {/* Oracle verdict bar — ambient, always visible, no click required */}
        <OracleBriefStrip />

        {/* Alert strip */}
        <AlertBanner alerts={data.alerts} />

        {/* Status bar */}
        <StatusBar data={data} />

        {/* Row 1: Regime + Fed Path + Economic Edge */}
        <div className="mb-row mb-row--3col">
          <RegimePanel data={data} />
          <FedPathPanel data={data} />
          <EconomicEdgePanel data={data} />
        </div>

        {/* Row 1.5: Pre-Signal Intelligence (ADP + GDPNow) */}
        <PreSignalPanel data={data} />

        {/* Row 2: Hidden Hands (full width) */}
        <HiddenHandsPanel data={data} />

        {/* Row 3: Derivatives + Kill Chain */}
        <div className="mb-row mb-row--2col">
          <DerivativesPanel data={data} />
          <KillChainPanel data={data} />
        </div>
      </div>
    </OracleContext.Provider>
  );
}
