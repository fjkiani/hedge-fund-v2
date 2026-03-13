/**
 * 🏦 The Feds Page — Federal Reserve Intelligence Dashboard
 *
 * Two data sources, merged:
 * 1. Brain Report (AgentX) — Fed speech tone, hawk/dove gauge, calendar
 * 2. Economic API (live) — FedWatch rate probabilities, TE calendar with slugs
 */

import { useAgentXReport } from '../components/agentx/hooks/useAgentXReport';
import { useFedIntelligence } from '../components/agentx/hooks/useFedIntelligence';
import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';
import { ConvictionHeader } from '../components/agentx/panels/ConvictionHeader';
import { FedTonePanel } from '../components/agentx/panels/FedTonePanel';
import { FedCalendarPanel } from '../components/agentx/panels/FedCalendarPanel';
import { FedShiftGauge } from '../components/agentx/panels/FedShiftGauge';
import { FedLiveMonitorPanel } from '../components/agentx/panels/FedLiveMonitorPanel';
import { EconomicCalendarWithSlugs } from '../components/agentx/panels/EconomicCalendarWithSlugs';
import { TavilyResearchPanel } from '../components/agentx/panels/TavilyResearchPanel';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Feds() {
    const { report, loading: brainLoading, error: brainError, lastRefresh, refresh } = useAgentXReport();
    const { fedwatch, calendar, loading: econLoading, error: econError } = useFedIntelligence();
    const { snapshot: intradaySnap } = useIntradaySnapshot();
    const thesisValid = intradaySnap ? (intradaySnap.thesis_valid || !intradaySnap.market_open) : true;

    /* Loading — show if BOTH sources are loading */
    if (brainLoading && econLoading && !report && !fedwatch) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
                <Card>
                    <div className="card-header">
                        <h2 className="card-title">🏦 The Feds — Federal Reserve Intelligence</h2>
                        <Badge variant="neutral">Scanning...</Badge>
                    </div>
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                        <span className="text-text-muted text-sm animate-pulse">
                            Analyzing Fed speeches, rate probabilities, FOMC calendar...
                        </span>
                    </div>
                </Card>
            </div>
        );
    }

    /* Error — only show if BOTH fail */
    if (brainError && econError && !report && !fedwatch) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
                <Card>
                    <div className="card-header">
                        <h2 className="card-title">🏦 The Feds</h2>
                        <Badge variant="bearish">Error</Badge>
                    </div>
                    <div className="p-4 text-red-400 text-sm font-mono">
                        {brainError || econError}
                        <button
                            onClick={refresh}
                            className="ml-4 px-3 py-1 bg-red-500/20 rounded hover:bg-red-500/30 transition"
                        >
                            Retry
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
            <div className="space-y-6">
                {/* Thesis warning (amber — Fed data is informational) */}
                {!thesisValid && (
                    <div style={{
                        width: '100%', padding: '0.75rem 1.25rem',
                        background: 'linear-gradient(135deg, #d97706, #b45309)',
                        border: '2px solid #f59e0b', borderRadius: '0.75rem', color: '#fff',
                        boxShadow: '0 0 15px rgba(217,119,6,0.2)',
                    }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                            ⚠️ THESIS INVALIDATED — Fed data shown for context only
                        </div>
                        {intradaySnap?.thesis_invalidation_reason && (
                            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.125rem' }}>
                                {intradaySnap.thesis_invalidation_reason}
                            </div>
                        )}
                    </div>
                )}

                {/* Page header */}
                <div style={{ marginBottom: '0.5rem' }}>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        🏦 The Feds
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Live rate probabilities · Economic calendar with exploitation slugs · Fed tone analysis
                    </p>
                </div>

                {/* Conviction header from brain report (if available) */}
                {report && (
                    <ConvictionHeader
                        report={report}
                        loading={brainLoading}
                        lastRefresh={lastRefresh}
                        onRefresh={refresh}
                    />
                )}

                {/* === ROW 1: Live FedWatch Monitor + Economic Calendar === */}
                <div className="grid grid-cols-2 gap-6">
                    <FedLiveMonitorPanel data={fedwatch} loading={econLoading} />
                    <EconomicCalendarWithSlugs events={calendar} loading={econLoading} />
                </div>

                {/* === ROW 2: Fed Tone + FOMC Calendar (from brain report) === */}
                {report && (
                    <div className="grid grid-cols-2 gap-6">
                        <FedTonePanel report={report} />
                        <FedCalendarPanel events={report.fed_calendar_events || []} />
                    </div>
                )}

                {/* === ROW 3: Hawk/Dove Gauge (from brain report) === */}
                {report && (
                    <FedShiftGauge
                        hawkishCount={report.fed_hawkish_count}
                        dovishCount={report.fed_dovish_count}
                        overallTone={report.fed_overall_tone}
                    />
                )}

                {/* === ROW 3: Research context === */}
                {report?.tavily_context && (
                    <TavilyResearchPanel context={report.tavily_context} />
                )}
            </div>
        </div>
    );
}
