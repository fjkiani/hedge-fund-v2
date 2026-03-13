/**
 * 🏛️ Politicians Page — "What are they buying, and do insiders agree?"
 *
 * Surfaces politician trades, Finnhub convergence/divergence signals,
 * spouse alerts, insider trades, and news catalysts.
 */

import { useAgentXReport } from '../components/agentx/hooks/useAgentXReport';
import { ConvictionHeader } from '../components/agentx/panels/ConvictionHeader';
import { PoliticianTradesPanel } from '../components/agentx/panels/PoliticianTradesPanel';
import { InsiderTradesPanel } from '../components/agentx/panels/InsiderTradesPanel';
import { FinnhubConvergencePanel } from '../components/agentx/panels/FinnhubConvergencePanel';
import { SpouseAlertBanner } from '../components/agentx/panels/SpouseAlertBanner';
import { FinnhubNewsPanel } from '../components/agentx/panels/FinnhubNewsPanel';
import { HotTickersStrip } from '../components/agentx/panels/HotTickersStrip';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function Politicians() {
    const { report, loading, error, lastRefresh, refresh } = useAgentXReport();

    /* Loading */
    if (loading && !report) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
                <Card>
                    <div className="card-header">
                        <h2 className="card-title">🏛️ Politicians — Trade Intelligence</h2>
                        <Badge variant="neutral">Scanning...</Badge>
                    </div>
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                        <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
                        <span className="text-text-muted text-sm animate-pulse">
                            Scanning politician trades, insider sentiment, Finnhub MSPR...
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
                        <h2 className="card-title">🏛️ Politicians</h2>
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
                        🏛️ Politicians
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Congressional trades, insider convergence, and spouse trade alerts
                    </p>
                </div>

                <ConvictionHeader
                    report={report}
                    loading={loading}
                    lastRefresh={lastRefresh}
                    onRefresh={refresh}
                />

                {/* Spouse alert banner — only shows when spouse trades exist */}
                <SpouseAlertBanner alerts={report.spouse_alerts || []} />

                <div className="grid grid-cols-2 gap-6">
                    <PoliticianTradesPanel hands={report.hidden_hands} />
                    <FinnhubConvergencePanel signals={report.finnhub_signals || []} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <InsiderTradesPanel hands={report.hidden_hands} />
                    <FinnhubNewsPanel news={report.finnhub_news || {}} />
                </div>

                <HotTickersStrip
                    tickers={report.hidden_hands.hot_tickers}
                    timestamp={report.timestamp}
                />
            </div>
        </div>
    );
}
