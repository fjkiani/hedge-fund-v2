/**
 * MasterBriefPanels — entry point for the Today's Brief page.
 *
 * Renders UnifiedBriefView (Alpha Terminal V8) which owns its own
 * data fetching via useMasterBrief and useOracleBrief hooks.
 */

import { UnifiedBriefView } from './UnifiedBriefView';

export function MasterBriefPanels() {
  return <UnifiedBriefView />;
}
