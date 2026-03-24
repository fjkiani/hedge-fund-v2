/**
 * 🎯 Master Brief Panels — Unified Intelligence Orchestrator
 *
 * Lean orchestrator: no panel logic here.
 * All panels live in ./panels/ per MDC spec.
 * One oracle, full context, all panels read slices.
 */

import { useMasterBrief } from '../../hooks/useMasterBrief';
import { useOracle as useOracleHook } from '../../hooks/useOracle';
import { OracleContext } from './OracleContext';

import { AlertBanner }      from './panels/AlertBanner';
import { OracleBriefStrip } from './panels/OracleBriefStrip';
import { MacroCommandBar }  from './panels/MacroCommandBar';
import { StrategyCardRow }  from './panels/StrategyCardRow';
import { TacticalSection }  from './panels/TacticalSection';
import { PreSignalSection } from './panels/PreSignalSection';
import { ForecastGrid }     from './panels/ForecastGrid';
import './MasterBriefPanels.css';

export function MasterBriefPanels() {
  const { data, loading, error } = useMasterBrief(120000);
  const oracle = useOracleHook(); // self-contained, 10-min interval

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
          <span className="mb-header__time">
            {new Date(data.as_of + (data.as_of.endsWith('Z') ? '' : 'Z'))
              .toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true })} ET
          </span>
        </div>

        {/* Oracle verdict bar — ambient, always visible, no click required */}
        <OracleBriefStrip />

        {/* Alert strip */}
        <AlertBanner alerts={data.alerts} />

        {/* Regime / next event / cap / scan */}
        <MacroCommandBar data={data} />

        {/* Row 1: Regime + Fed Path + Economic Edge */}
        <StrategyCardRow data={data} />

        {/* Row 2: Pre-Signal Intelligence (ADP + GDPNow) */}
        <PreSignalSection data={data} />

        {/* Row 3: Hidden Hands + [Derivatives + Kill Chain] */}
        <TacticalSection data={data} />

        {/* Row 4: Forecast snapshot grid */}
        <ForecastGrid data={data} />
      </div>
    </OracleContext.Provider>
  );
}
