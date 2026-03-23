/**
 * 🏛️ Politicians Page — Tactical Intelligence V3.2
 *
 * Layout: Header + Spouse Banner + 12-col grid (Feed 7-col + Convergence 5-col)
 * + AiBriefingPanel overlay
 *
 * Zero hardcoded data. Everything from useAgentXReport().
 */

import { useState } from 'react';
import { useAgentXReport } from '../components/agentx/hooks/useAgentXReport';
import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';
import { SpouseAlertBanner } from '../components/agentx/panels/SpouseAlertBanner';
import { PoliticianFeedPanel } from '../components/agentx/panels/PoliticianFeedPanel';
import { ConvergenceCard } from '../components/agentx/panels/ConvergenceCard';
import { AiBriefingPanel } from '../components/agentx/panels/AiBriefingPanel';
import { ConvictionDisplay } from '../components/agentx/primitives/ConvictionDisplay';
import { MetricBadge } from '../components/agentx/primitives/MetricBadge';
import type { BriefableItem } from '../components/agentx/panels/AiBriefingPanel';
import type { TradeItemData } from '../components/agentx/panels/TradeItemPanel';
import type { FinnhubSignal } from '../components/agentx/types';

export function Politicians() {
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
                    Scanning politician trades, insider sentiment, Finnhub MSPR...
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

    const signals = report.finnhub_signals || [];
    const divergenceCount = signals.filter(s => s.convergence === 'DIVERGENCE').length;

    const handleTradeClick = (trade: TradeItemData) => {
        setActiveBrief(trade as BriefableItem);
    };

    const handleConvergenceClick = (signal: FinnhubSignal) => {
        setActiveBrief({
            ticker: signal.ticker,
            signal: signal.convergence,
            logic: signal.reasoning?.[0] || signal.convergence,
            meaning: signal.reasoning?.slice(1).join(' ') || '',
            slug: `conv-${signal.ticker}`,
        } as BriefableItem);
    };

    return (
        <div className="politicians-page">
            {/* Thesis invalid */}
            {!thesisValid && (
                <div className="agentx-thesis-warning">
                    ⛔ THESIS INVALIDATED — trade signals may be stale
                    {intradaySnap?.thesis_invalidation_reason && (
                        <div className="agentx-thesis-warning__reason">
                            {intradaySnap.thesis_invalidation_reason}
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="politicians-page__header">
                <div className="politicians-page__header-left">
                    <h2 className="politicians-page__title">Intelligence Signal Grid</h2>
                    <p className="politicians-page__subtitle">
                        Intersection of legislative policy and institutional order flow
                    </p>
                </div>
                <div className="politicians-page__header-right">
                    <div className="politicians-page__mini-conviction">
                        <ConvictionDisplay score={report.divergence_boost} maxScore={10} />
                    </div>
                    <div className="politicians-page__meta-stack">
                        <MetricBadge label="Boost" value={`+${report.divergence_boost}`} variant="green" />
                        <MetricBadge label="Tone" value={report.fed_overall_tone || '—'} variant="purple" />
                        <button onClick={refresh} disabled={loading} className="agentx-sidebar__refresh-btn">
                            {loading ? '⏳' : '🔄 Refresh'}
                        </button>
                        {lastRefresh && (
                            <span className="agentx-sidebar__timestamp">{lastRefresh.toLocaleTimeString()}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Spouse Alert Banner */}
            <SpouseAlertBanner
                alerts={report.spouse_alerts || []}
                onTradeClick={handleTradeClick}
            />

            {/* Main grid */}
            <div className="politicians-page__grid">
                {/* Left: Politician Feed */}
                <div className="politicians-page__feed-col">
                    <PoliticianFeedPanel
                        hands={report.hidden_hands}
                        onTradeClick={handleTradeClick}
                    />
                </div>

                {/* Right: Convergence Analysis */}
                <div className="politicians-page__convergence-col">
                    <div className="politicians-page__convergence-header">
                        <span className="politicians-page__convergence-title">Insider Convergence</span>
                        <span className="politicians-page__convergence-badge">MSPR ENGINE v4</span>
                    </div>

                    <div className="politicians-page__convergence-cards">
                        {signals.length > 0 ? (
                            signals.map((sig, i) => (
                                <ConvergenceCard key={i} signal={sig} onClick={handleConvergenceClick} />
                            ))
                        ) : (
                            <div className="politicians-page__empty">No Finnhub signals available</div>
                        )}
                    </div>

                    {divergenceCount > 0 && (
                        <div className="politicians-page__divergence-alert">
                            <span className="politicians-page__divergence-icon">⚡</span>
                            <div>
                                <span className="politicians-page__divergence-label">Divergence Alert</span>
                                <p className="politicians-page__divergence-text">
                                    System identified {divergenceCount} divergence node{divergenceCount > 1 ? 's' : ''} where
                                    Politicians are accumulating against insider distribution.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
