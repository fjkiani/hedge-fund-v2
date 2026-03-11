import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { narrativeApi } from '../../lib/api';

interface SessionData {
    has_data: boolean;
    daily_context: {
        outlook: string;
        key_themes: string[];
        risk_assessment: string;
    } | null;
    market_regime: {
        regime: string;
        vix_level: number | null;
    } | null;
    narrative_chain: Array<{ date: string; narrative: string }>;
    note?: string;
}

export function SessionMemoryPanel() {
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        narrativeApi
            .getPreviousSession()
            .then((data: any) => setSession(data))
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Card>
                <div className="card-header">
                    <h2 className="card-title">📅 Yesterday's Context</h2>
                </div>
                <div className="text-text-secondary text-center py-6 text-sm">Loading session memory...</div>
            </Card>
        );
    }

    if (!session?.has_data) {
        return (
            <Card>
                <div className="card-header">
                    <h2 className="card-title">📅 Yesterday's Context</h2>
                </div>
                <div className="text-text-muted text-center py-6 text-sm">
                    No previous session data — first day or no session saved yesterday
                </div>
            </Card>
        );
    }

    const dc = session.daily_context;
    const regime = session.market_regime;

    const outlookEmoji = dc?.outlook === 'TRENDING_DOWN' ? '📉' :
        dc?.outlook === 'TRENDING_UP' ? '📈' : '📊';

    const riskColor = dc?.risk_assessment === 'HIGH'
        ? 'border-accent-red/40 bg-accent-red/10 text-accent-red'
        : dc?.risk_assessment === 'ELEVATED'
            ? 'border-accent-orange/40 bg-accent-orange/10 text-accent-orange'
            : 'border-accent-green/40 bg-accent-green/10 text-accent-green';

    return (
        <Card>
            <div className="card-header">
                <h2 className="card-title">📅 Yesterday's Context</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${riskColor}`}>
                    {dc?.risk_assessment || 'UNKNOWN'} RISK
                </span>
            </div>

            <div className="space-y-3">
                {/* Outlook + Regime */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                            {outlookEmoji} {dc?.outlook?.replace('_', ' ') || 'N/A'}
                        </span>
                        {regime?.regime && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary">
                                {regime.regime}
                            </span>
                        )}
                    </div>
                    {regime?.vix_level && (
                        <span className="text-[10px] font-mono text-text-muted">
                            VIX {regime.vix_level.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Key Themes */}
                {dc?.key_themes && dc.key_themes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {dc.key_themes.map((theme, i) => (
                            <span
                                key={i}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                            >
                                {theme}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="card-footer">
                <span className="text-text-muted">Cross-Session Memory</span>
            </div>
        </Card>
    );
}
