/**
 * 🧠 Agent X Dashboard — Thin Orchestrator
 *
 * Imports modular panels + custom hook. Zero business logic here.
 * Each panel is independent, reusable, and testable.
 */

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

import { useAgentXReport } from './hooks/useAgentXReport';
import { useIntradaySnapshot } from '../../hooks/useIntradaySnapshot';
import { ConvictionHeader } from './panels/ConvictionHeader';
import { PoliticianTradesPanel } from './panels/PoliticianTradesPanel';
import { InsiderTradesPanel } from './panels/InsiderTradesPanel';
import { FedTonePanel } from './panels/FedTonePanel';
import { TavilyResearchPanel } from './panels/TavilyResearchPanel';
import { HotTickersStrip } from './panels/HotTickersStrip';

export function AgentXDashboard() {
    const { report, loading, error, lastRefresh, refresh } = useAgentXReport();
    const { snapshot: intradaySnap } = useIntradaySnapshot();
    const thesisValid = intradaySnap ? (intradaySnap.thesis_valid || !intradaySnap.market_open) : true;

    /* Loading */
    if (loading && !report) {
        return (
            <div className="space-y-6">
                <Card>
                    <div className="card-header">
                        <h2 className="card-title">🧠 Agent X — Hidden Conviction Intelligence</h2>
                        <Badge variant="neutral">Initializing...</Badge>
                    </div>
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                        <span className="text-text-muted text-sm animate-pulse">
                            Scanning Fed speeches, politician trades, insider flow, Tavily research...
                        </span>
                    </div>
                </Card>
            </div>
        );
    }

    /* Error */
    if (error && !report) {
        return (
            <Card>
                <div className="card-header">
                    <h2 className="card-title">🧠 Agent X</h2>
                    <Badge variant="bearish">Error</Badge>
                </div>
                <div className="p-4 text-red-400 text-sm font-mono">
                    {error}
                    <button
                        onClick={refresh}
                        className="ml-4 px-3 py-1 bg-red-500/20 rounded hover:bg-red-500/30 transition"
                    >
                        Retry
                    </button>
                </div>
            </Card>
        );
    }

    if (!report) return null;

    /* ── Layout: compose panels ────────────────────── */
    return (
        <div className="space-y-6">
            {/* Thesis Invalid Warning */}
            {!thesisValid && (
                <div style={{
                    width: '100%',
                    padding: '0.75rem 1.25rem',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    border: '2px solid #ef4444',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    boxShadow: '0 0 15px rgba(220, 38, 38, 0.2)',
                }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                        ⛔ THESIS INVALIDATED — conviction signals may be unreliable
                    </div>
                    {intradaySnap?.thesis_invalidation_reason && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.15rem' }}>
                            {intradaySnap.thesis_invalidation_reason}
                        </div>
                    )}
                </div>
            )}
            <ConvictionHeader
                report={report}
                loading={loading}
                lastRefresh={lastRefresh}
                onRefresh={refresh}
            />

            <div className="grid grid-cols-2 gap-6">
                <PoliticianTradesPanel hands={report.hidden_hands} />
                <InsiderTradesPanel hands={report.hidden_hands} />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <FedTonePanel report={report} />
                <TavilyResearchPanel context={report.tavily_context} />
            </div>

            <HotTickersStrip
                tickers={report.hidden_hands.hot_tickers}
                timestamp={report.timestamp}
            />
        </div>
    );
}
