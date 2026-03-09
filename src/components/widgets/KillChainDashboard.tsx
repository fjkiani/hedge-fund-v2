/**
 * 🐺 Kill Chain Dashboard Widget
 * 
 * Full-width widget showing the Kill Chain Engine status:
 * - Alert banner (GREEN/YELLOW/RED)
 * - 5 layer status cards (FedWatch, Dark Pool, COT, GEX, 13F)
 * - Mismatch alerts
 * - Shadow narrative
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface KillChainMismatch {
    severity: string;
    description: string;
    layer: string;
}

interface KillChainReport {
    alert_level: 'GREEN' | 'YELLOW' | 'RED';
    timestamp: string;
    scan_time_seconds: number;
    layers_active: number;
    layers_total: number;
    narrative: string;
    mismatches: KillChainMismatch[];
    layers: Record<string, any>;
}

const LAYER_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
    fedwatch: { icon: '📊', label: 'FedWatch', color: '#60a5fa' },
    dark_pool: { icon: '🏴', label: 'Dark Pool', color: '#a78bfa' },
    cot: { icon: '📋', label: 'COT', color: '#34d399' },
    gex: { icon: '⚡', label: 'GEX', color: '#fbbf24' },
    sec_13f: { icon: '🏛️', label: '13F', color: '#f87171' },
};

function getAlertStyles(level: string) {
    switch (level) {
        case 'RED':
            return { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', badge: 'bearish' as const };
        case 'YELLOW':
            return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', badge: 'neutral' as const };
        case 'GREEN':
        default:
            return { bg: 'bg-green-500/10', border: 'border-green-500/50', text: 'text-green-400', badge: 'bullish' as const };
    }
}

function formatLayerSummary(name: string, data: any): string {
    if (!data) return 'No data';

    switch (name) {
        case 'fedwatch': {
            const rate = data.current_rate;
            const next = data.next_meeting;
            if (next) return `Rate ${rate}% | Hold ${next.p_hold?.toFixed(0)}% | ${next.label}`;
            return `Rate: ${rate}%`;
        }
        case 'dark_pool': {
            const top = data.top_positions;
            if (top && top.length > 0) {
                const names = top.slice(0, 3).map((p: any) => p.ticker).join(', ');
                const topVal = (top[0].dp_position_dollars / 1e9).toFixed(1);
                return `${names} | Top: $${topVal}B`;
            }
            return 'Scanning...';
        }
        case 'cot': {
            const specs = data.specs_net;
            const dir = specs > 0 ? '🟢 LONG' : specs < 0 ? '🔴 SHORT' : '⚪ FLAT';
            return `Specs ${specs?.toLocaleString()} ${dir}`;
        }
        case 'gex': {
            const regime = data.gamma_regime;
            const gex = data.total_gex;
            const spot = data.spot_price;
            if (gex) return `${regime} (${(gex / 1e6).toFixed(1)}M) | $${spot?.toFixed(0)}`;
            return regime || 'Calculating...';
        }
        case 'sec_13f': {
            const filings = data.filings;
            if (filings && filings.length > 0) {
                return `${filings.length} funds tracked | Latest: ${filings[0].fund?.split(',')[0]}`;
            }
            return 'Scanning SEC...';
        }
        default:
            return JSON.stringify(data).slice(0, 60);
    }
}

export function KillChainDashboard() {
    const [report, setReport] = useState<KillChainReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/v1/killchain/scan`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setReport(data);
            setError(null);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch kill chain data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every 60s
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && !report) {
        return (
            <Card>
                <div className="card-header">
                    <h2 className="card-title">🐺 Kill Chain Intelligence</h2>
                    <Badge variant="neutral">Loading...</Badge>
                </div>
                <div className="flex items-center justify-center h-32">
                    <div className="text-text-muted animate-pulse">Scanning 5 data layers...</div>
                </div>
            </Card>
        );
    }

    if (error && !report) {
        return (
            <Card>
                <div className="card-header">
                    <h2 className="card-title">🐺 Kill Chain Intelligence</h2>
                    <Badge variant="bearish">Error</Badge>
                </div>
                <div className="p-4 text-red-400 text-sm font-mono">
                    {error}
                    <button
                        onClick={fetchData}
                        className="ml-4 px-3 py-1 bg-red-500/20 rounded hover:bg-red-500/30 transition"
                    >
                        Retry
                    </button>
                </div>
            </Card>
        );
    }

    if (!report) return null;

    const alertStyles = getAlertStyles(report.alert_level);

    return (
        <Card>
            {/* Header with alert level */}
            <div className={`card-header ${alertStyles.bg} border-b ${alertStyles.border} rounded-t-lg`}>
                <div className="flex items-center gap-3">
                    <h2 className="card-title">🐺 Kill Chain Intelligence</h2>
                    <Badge variant={alertStyles.badge}>
                        {report.alert_level} ALERT
                    </Badge>
                    <span className="text-xs text-text-muted">
                        {report.layers_active}/{report.layers_total} layers
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {report.scan_time_seconds && (
                        <span className="text-xs text-text-muted">
                            {report.scan_time_seconds.toFixed(1)}s scan
                        </span>
                    )}
                    {lastRefresh && (
                        <span className="text-xs text-text-muted">
                            {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-2 py-1 text-xs bg-bg-tertiary rounded hover:bg-bg-primary transition disabled:opacity-50"
                    >
                        {loading ? '⏳' : '🔄'}
                    </button>
                </div>
            </div>

            {/* Mismatches (if any) */}
            {report.mismatches.length > 0 && (
                <div className="p-3 space-y-2">
                    {report.mismatches.map((m, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-2 p-2 rounded text-sm ${m.severity === 'RED'
                                    ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                                    : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
                                }`}
                        >
                            <span>{m.severity === 'RED' ? '🔴' : '🟡'}</span>
                            <span>{m.description}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Layer Cards */}
            <div className="grid grid-cols-5 gap-3 p-4">
                {Object.entries(LAYER_CONFIG).map(([key, config]) => {
                    const layerData = report.layers[key];
                    const isActive = !!layerData;
                    const summary = formatLayerSummary(key, layerData);

                    return (
                        <div
                            key={key}
                            className={`p-3 rounded-lg border transition ${isActive
                                    ? 'bg-bg-tertiary border-border-subtle hover:border-border-default'
                                    : 'bg-bg-primary border-border-subtle opacity-50'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{config.icon}</span>
                                <span className="text-xs font-semibold text-text-primary" style={{ color: config.color }}>
                                    {config.label}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                            </div>
                            <div className="text-xs text-text-secondary leading-relaxed truncate" title={summary}>
                                {summary}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Narrative */}
            {report.narrative && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
                        <div className="text-xs font-semibold text-text-muted mb-1">Shadow Narrative</div>
                        <div className="text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">
                            {report.narrative}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
