import { createContext, useContext } from 'react';
import type { OracleBrief } from '../../hooks/useOracleBrief';

/**
 * OracleContext — distributes the unified oracle result to all panels.
 *
 * Provider lives in MasterBriefPanels (the orchestrator).
 * All panels (TacticalSection, PreSignalSection, KillChainPanel) read
 * their oracle slice via useOracle() — no direct Groq calls in production.
 */
export const OracleContext = createContext<OracleBrief | null>(null);

export function useOracle(): OracleBrief | null {
  return useContext(OracleContext);
}
