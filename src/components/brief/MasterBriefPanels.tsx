/**
 * MasterBriefPanels — 40-line orchestrator per MDC spec.
 *
 * Hook ownership:
 *   useMasterBrief  → owns the full brief  (GET /brief/master)
 *   useOracleBrief  → derives oracle state (POST /oracle/brief with brief)
 *
 * Oracle is provided via OracleContext so every panel reads its slice
 * without a direct fetch. Oracle failure → UNKNOWN, panels still fully render.
 */

import { useMasterBrief }  from '../../hooks/useMasterBrief';
import { useOracleBrief }  from '../../hooks/useOracleBrief';
import { OracleContext }   from './OracleContext';

import { AlertBanner }       from './panels/AlertBanner';
import { OracleBriefStrip }  from './panels/OracleBriefStrip';
import { MacroCommandBar }   from './panels/MacroCommandBar';
import { StrategyCardRow }   from './panels/StrategyCardRow';
import { TacticalSection }   from './panels/TacticalSection';
import { PreSignalSection }  from './panels/PreSignalSection';
import { EcoSignalsPanel }   from './panels/EcoSignalsPanel';
import { ForecastGrid }      from './panels/ForecastGrid';
import './MasterBriefPanels.css';

export function MasterBriefPanels() {
  const { data, loading, error } = useMasterBrief(120000);
  const { oracle } = useOracleBrief(data);        // MDC spec: one hook owns brief, one derives oracle

  if (loading) return <div className="mb-loading"><div className="mb-loading__spinner" /><span>Loading unified intelligence...</span></div>;
  if (error || !data) return <div className="mb-error"><span className="mb-error__icon">⚠️</span><span>Master Brief unavailable: {error || 'No data'}</span></div>;

  return (
    <OracleContext.Provider value={oracle}>
      <div className="mb-container">
        <div className="mb-header">
          <span className="mb-header__title">🎯 UNIFIED INTELLIGENCE</span>
          <span className="mb-header__time">
            {new Date(data.as_of + (data.as_of?.endsWith('Z') ? '' : 'Z'))
              .toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true })} ET
          </span>
        </div>
        <OracleBriefStrip />
        <AlertBanner alerts={data.alerts} />
        <MacroCommandBar    data={data} />
        <StrategyCardRow    data={data} />
        <PreSignalSection   data={data} />
        <TacticalSection    data={data} />
        <EcoSignalsPanel    data={data} />
        <ForecastGrid       data={data} />
      </div>
    </OracleContext.Provider>
  );
}
