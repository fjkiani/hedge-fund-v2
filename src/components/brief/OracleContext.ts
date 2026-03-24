import { createContext, useContext } from 'react';
import type { OracleState } from '../../hooks/useOracleBrief';

/**
 * OracleContext — distributes the unified oracle result to all panels.
 *
 * Provider lives in MasterBriefPanels (the orchestrator).
 * Population: MasterBriefPanels calls useOracleBrief(masterData)
 *   and wraps children in <OracleContext.Provider value={oracle.oracle}>.
 *
 * Consumption: panels call useOracle() to get their oracle slice.
 * No panel calls Groq directly — production rule.
 */
export const OracleContext = createContext<OracleState | null>(null);

export function useOracle(): OracleState | null {
  return useContext(OracleContext);
}
