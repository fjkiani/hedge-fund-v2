/** StrategyCardRow — 3-col: RegimeCard + FedPathCard + EconomicEdgeCard */
import type { MasterBrief } from '../../../hooks/useMasterBrief';
import { useOracle } from '../OracleContext';

// ── Regime ────────────────────────────────────────────────────────────────────
function RegimeCard({ data }: { data: MasterBrief }) {
  const mr = data.macro_regime;
  const oracle = useOracle();
  const orcRead = oracle?.sections?.regime;
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
      {orcRead?.summary && (
        <div className="mb-oracle-read">
          <span className="mb-oracle-read__label">NYX:</span>
          <span className="mb-oracle-read__text">{orcRead.summary}</span>
          {orcRead.confidence != null && (
            <span className="mb-oracle-read__conf">{Math.round(orcRead.confidence * 100)}%</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Fed Path ──────────────────────────────────────────────────────────────────
function FedPathCard({ data }: { data: MasterBrief }) {
  const fi = data.fed_intelligence;
  if (!fi || fi.error) return <div className="mb-panel mb-panel--fed"><div className="mb-panel__error">FedWatch unavailable</div></div>;

  const rp   = fi.rate_path;
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

// ── Economic Edge ─────────────────────────────────────────────────────────────
function EconomicEdgeCard({ data }: { data: MasterBrief }) {
  const nowcast    = data.nowcast;
  const thresholds = data.dynamic_thresholds || {};
  const veto       = data.economic_veto;

  return (
    <div className="mb-panel mb-panel--economic">
      <div className="mb-panel__title">📈 ECONOMIC EDGE</div>

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

// ── Row export ────────────────────────────────────────────────────────────────
export function StrategyCardRow({ data }: { data: MasterBrief }) {
  return (
    <div className="mb-row mb-row--3col">
      <RegimeCard data={data} />
      <FedPathCard data={data} />
      <EconomicEdgeCard data={data} />
    </div>
  );
}
