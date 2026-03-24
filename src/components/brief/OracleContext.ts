import { createContext, useContext } from 'react';
import type { OracleState } from '../../hooks/useOracle';

/**
 * OracleContext — distributes the unified oracle result to all panels.
 *
 * Provider lives in MasterBriefPanels (the orchestrator).
 * All panels (KillChainPanel, DerivativesPanel, PreSignalPanel, HiddenHandsPanel) read
 * their oracle slice via useOracle() — no direct Groq calls in production.
 */
export const OracleContext = createContext<OracleState | null>(null);

export function useOracle(): OracleState | null {
  return useContext(OracleContext);
}
