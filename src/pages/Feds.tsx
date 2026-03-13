/**
 * 🏦 The Feds Page — "What is the Fed saying and should I care?"
 *
 * Surfaces Fed speeches, tone analysis, upcoming FOMC events,
 * and the hawk/dove balance — all from the brain report.
 */

import { useAgentXReport } from '../components/agentx/hooks/useAgentXReport';
import { ConvictionHeader } from '../components/agentx/panels/ConvictionHeader';
import { FedTonePanel } from '../components/agentx/panels/FedTonePanel';
import { FedCalendarPanel } from '../components/agentx/panels/FedCalendarPanel';
import { FedShiftGauge } from '../components/agentx/panels/FedShiftGauge';
import { TavilyResearchPanel } from '../components/agentx/panels/TavilyResearchPanel';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Feds() {
    const { report, loading, error, lastRefresh, refresh } = useAgentXReport();

    /* Loading */
    if (loading && !report) {
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
                            Analyzing Fed speeches, FOMC calendar, tone shifts...
                        </span>
                    </div>
                </Card>
            </div>
        );
    }

    /* Error */
    if (error && !report) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
                <Card>
                    <div className="card-header">
                        <h2 className="card-title">🏦 The Feds</h2>
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
            </div>
        );
    }

    if (!report) return null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
            <div className="space-y-6">
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
                        Federal Reserve speech analysis, FOMC calendar, and tone shifts
                    </p>
                </div>

                <ConvictionHeader
                    report={report}
                    loading={loading}
                    lastRefresh={lastRefresh}
                    onRefresh={refresh}
                />

                <div className="grid grid-cols-2 gap-6">
                    <FedTonePanel report={report} />
                    <FedCalendarPanel events={report.fed_calendar_events || []} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <FedShiftGauge
                        hawkishCount={report.fed_hawkish_count}
                        dovishCount={report.fed_dovish_count}
                        overallTone={report.fed_overall_tone}
                    />
                    <TavilyResearchPanel context={report.tavily_context} />
                </div>
            </div>
        </div>
    );
}
