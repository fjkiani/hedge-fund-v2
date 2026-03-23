/**
 * 🧠 AgentX Dashboard — Tactical UI V3.1
 *
 * Sidebar (ConvictionDisplay + metrics + FocusList)
 * + Signal Command Feed grid
 * + AiBriefingPanel overlay
 *
 * Zero hardcoded data. Everything from useAgentXReport().
 */

import { useState } from 'react';
import { useAgentXReport } from './hooks/useAgentXReport';
import { useIntradaySnapshot } from '../../hooks/useIntradaySnapshot';
import { ConvictionDisplay } from './primitives/ConvictionDisplay';
import { MetricBadge } from './primitives/MetricBadge';
import { FocusListPanel } from './panels/FocusListPanel';
import { SignalFeedGrid } from './panels/SignalFeedGrid';
import { AiBriefingPanel } from './panels/AiBriefingPanel';
import type { BriefableItem } from './panels/AiBriefingPanel';
import type { UnifiedSignal } from './panels/SignalFeedGrid';

export function AgentXDashboard() {
    const { report, loading, error, lastRefresh, refresh } = useAgentXReport();
    const { snapshot: intradaySnap } = useIntradaySnapshot();
    const thesisValid = intradaySnap ? (intradaySnap.thesis_valid || !intradaySnap.market_open) : true;
    const [activeBrief, setActiveBrief] = useState<BriefableItem | null>(null);

    /* Loading */
    if (loading && !report) {
        return (
            <div className="agentx-loading">
                <div className="agentx-loading__spinner" />
                <span className="agentx-loading__text">
                    Scanning Fed speeches, politician trades, insider flow...
                </span>
            </div>
        );
    }

    /* Error */
    if (error && !report) {
        return (
            <div className="agentx-error">
                <span className="agentx-error__text">{error}</span>
                <button onClick={refresh} className="agentx-error__retry">Retry</button>
            </div>
        );
    }

    if (!report) return null;

    // Derive metrics from live data
    const biasLabel = report.hidden_hands.politician_buys > report.hidden_hands.politician_sells ? 'LONG' : 'SHORT';
    const biasVariant = biasLabel === 'LONG' ? 'green' as const : 'red' as const;
    const clusterCount = report.finnhub_signals?.length || 0;

    const handleSignalClick = (signal: UnifiedSignal) => {
        setActiveBrief(signal as BriefableItem);
    };

    return (
        <div className="agentx-layout">
            {/* Thesis invalid */}
            {!thesisValid && (
                <div className="agentx-thesis-warning">
                    ⛔ THESIS INVALIDATED — conviction signals may be unreliable
                    {intradaySnap?.thesis_invalidation_reason && (
                        <div className="agentx-thesis-warning__reason">
                            {intradaySnap.thesis_invalidation_reason}
                        </div>
                    )}
                </div>
            )}

            {/* Sidebar */}
            <aside className="agentx-sidebar">
                <div className="agentx-sidebar__panel">
                    <div className="agentx-sidebar__title-row">
                        <h2 className="agentx-sidebar__title">Agent X</h2>
                        <span className="agentx-sidebar__subtitle">Oracle Node</span>
                    </div>

                    <ConvictionDisplay score={report.divergence_boost} />

                    <div className="agentx-sidebar__metrics">
                        <MetricBadge label="Bias" value={biasLabel} variant={biasVariant} />
                        <MetricBadge label="Signals" value={`${clusterCount} ACTIVE`} variant="purple" />
                        <MetricBadge label="Scan" value={`${report.scan_time_seconds || '—'}s`} variant="default" />
                        <MetricBadge label="Tone" value={report.fed_overall_tone || '—'} variant="cyan" />
                    </div>

                    <div className="agentx-sidebar__refresh">
                        <button onClick={refresh} disabled={loading} className="agentx-sidebar__refresh-btn">
                            {loading ? '⏳ Scanning...' : '🔄 Refresh'}
                        </button>
                        {lastRefresh && (
                            <span className="agentx-sidebar__timestamp">{lastRefresh.toLocaleTimeString()}</span>
                        )}
                    </div>

                    {/* Conviction reasons */}
                    <div className="agentx-sidebar__reasons">
                        <span className="agentx-sidebar__reasons-label">Conviction Signals</span>
                        {report.reasons.length > 0 ? (
                            report.reasons.map((r, i) => (
                                <div key={i} className="agentx-sidebar__reason">→ {r}</div>
                            ))
                        ) : (
                            <div className="agentx-sidebar__empty">No conviction signals</div>
                        )}
                    </div>
                </div>

                <FocusListPanel tickers={report.hidden_hands.hot_tickers || []} />
            </aside>

            {/* Main signal feed */}
            <main className="agentx-main">
                <SignalFeedGrid report={report} onSignalClick={handleSignalClick} />
            </main>

            {/* Oracle overlay */}
            {activeBrief && (
                <div className="oracle-overlay">
                    <div className="oracle-overlay__backdrop" onClick={() => setActiveBrief(null)} />
                    <AiBriefingPanel item={activeBrief} onClose={() => setActiveBrief(null)} />
                </div>
            )}
        </div>
    );
}
