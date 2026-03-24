/**
 * TacticalSection/index.tsx — layout only, per MDC spec.
 * Imports each panel from its own file.
 */
import type { MasterBrief } from '../../../../hooks/useMasterBrief';
import { HiddenHandsPanel }  from './HiddenHandsPanel';
import { DerivativesPanel }  from './DerivativesPanel';
import { KillChainPanel }    from './KillChainPanel';

export function TacticalSection({ data }: { data: MasterBrief }) {
  return (
    <>
      <HiddenHandsPanel data={data} />
      <div className="mb-row mb-row--2col">
        <DerivativesPanel data={data} />
        <KillChainPanel   data={data} />
      </div>
    </>
  );
}
