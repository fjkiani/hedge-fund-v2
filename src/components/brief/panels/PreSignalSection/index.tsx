/**
 * PreSignalSection/index.tsx — layout only, per MDC spec.
 * Renders cards only when signal !== 'IN_LINE'.
 */
import type { MasterBrief } from '../../../../hooks/useMasterBrief';
import { useOracle }        from '../../OracleContext';
import { OracleRead }       from '../OracleRead';
import { ADPCard }          from './ADPCard';
import { GDPCard }          from './GDPCard';
import { JoblessCard }      from './JoblessCard';

export function PreSignalSection({ data }: { data: MasterBrief }) {
  const oracle = useOracle();
  const adp = data.adp_prediction;
  const gdp = data.gdp_nowcast;
  const jc  = data.jobless_claims;

  const anyVisible =
    (adp && !adp.error && adp.signal !== 'IN_LINE') ||
    (gdp && !gdp.error && gdp.signal !== 'IN_LINE') ||
    (jc  && !jc.error  && jc.signal  !== 'IN_LINE');

  if (!anyVisible) return null;

  return (
    <div className="mb-panel mb-panel--presignal mb-panel--full">
      <div className="mb-panel__title">⚡ PRE-SIGNAL INTELLIGENCE</div>
      <div className="mb-presignal-grid">
        <ADPCard    data={data} />
        <GDPCard    data={data} />
        <JoblessCard data={data} />
      </div>
      <OracleRead section={oracle?.sections?.pre_signal} />
      {adp?.as_of && (
        <div className="mb-presignal-footer">
          Updated: {new Date(adp.as_of + 'Z').toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true })} ET
        </div>
      )}
    </div>
  );
}
