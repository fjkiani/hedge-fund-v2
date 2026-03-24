/**
 * derivativesHelpers — per MDC spec, buildCOTSummary extracted as named helper.
 */
import type { MasterBrief } from '../../../../hooks/useMasterBrief';

type Deriv = MasterBrief['derivatives'];

/**
 * buildCOTSummary
 * MDC format: "Specs NET ${side} (${net}), ${divergent ? '⚠️ DIVERGENT' : 'aligned'}"
 */
export function buildCOTSummary(d: Deriv): string | null {
  if (!d || d.cot_spec_net === undefined || d.cot_spec_net === null) return null;
  const net  = d.cot_spec_net.toLocaleString();
  const side = d.cot_spec_side ?? (d.cot_spec_net < 0 ? 'SHORT' : 'LONG');
  const div  = d.cot_divergent ? '⚠️ DIVERGENT' : 'aligned';
  return `Specs NET ${side} (${net}), ${div}`;
}
