/**
 * 📅 EconomicCalendarWithSlugs — Live TE Calendar + Exploitation Insights
 *
 * Each critical event (CPI, NFP, etc.) gets an "exploitation slug" showing:
 * - Historical surprise pattern
 * - Expected Fed Watch shift
 * - System action (VETO LONGS, FAVOR CUTS, etc.)
 *
 * VERIFIED FIELD NAMES against TECalendarEvent.to_dict() (2026-03-13):
 *   - evt.event (not event_name)
 *   - evt.actual / forecast / previous / consensus are STRINGS like "1.376M"
 *   - evt.importance is "HIGH" / "MEDIUM" / "LOW"
 *   - evt.is_upcoming, evt.has_actual, evt.has_consensus are booleans
 */

import { Card } from '../../ui/Card';
import type { EconEvent } from '../hooks/useFedIntelligence';

interface Props {
    events: EconEvent[];
    loading?: boolean;
}

/**
 * Exploitation slug config — matches FedShiftPredictor.CATEGORY_COEFFICIENTS exactly.
 * Values verified against fed_shift_predictor.py on 2026-03-13.
 */
const EXPLOIT_SLUGS: Record<string, {
    sensitivity: number;
    action_if_hot: string;
    action_if_cold: string;
    color_hot: string;
    color_cold: string;
}> = {
    'CPI': {
        sensitivity: 25,
        action_if_hot: 'VETO LONGS · Hike risk rises',
        action_if_cold: 'FAVOR CUTS · Dovish pivot',
        color_hot: '#ef4444',
        color_cold: '#22c55e',
    },
    'PCE': {
        sensitivity: 25,
        action_if_hot: 'VETO LONGS · Core inflation sticky',
        action_if_cold: 'FAVOR CUTS · Disinflation confirmed',
        color_hot: '#ef4444',
        color_cold: '#22c55e',
    },
    'NFP': {
        sensitivity: 15,
        action_if_hot: 'REDUCE RISK · Strong labor = no cuts',
        action_if_cold: 'ADD RISK · Weak labor = cut catalyst',
        color_hot: '#f59e0b',
        color_cold: '#22c55e',
    },
    'NONFARM': {
        sensitivity: 15,
        action_if_hot: 'REDUCE RISK · Strong labor = no cuts',
        action_if_cold: 'ADD RISK · Weak labor = cut catalyst',
        color_hot: '#f59e0b',
        color_cold: '#22c55e',
    },
    'GDP': {
        sensitivity: 10,
        action_if_hot: 'NEUTRAL · Growth not a rate driver',
        action_if_cold: 'FAVOR CUTS · Recession risk',
        color_hot: '#94a3b8',
        color_cold: '#22c55e',
    },
    'PPI': {
        sensitivity: 15,
        action_if_hot: 'WATCH · Pipeline inflation',
        action_if_cold: 'FAVOR CUTS · Upstream disinflation',
        color_hot: '#f59e0b',
        color_cold: '#22c55e',
    },
    'FOMC': {
        sensitivity: 0,
        action_if_hot: 'DIRECT RATE DECISION',
        action_if_cold: 'DIRECT RATE DECISION',
        color_hot: '#a855f7',
        color_cold: '#a855f7',
    },
    'CLAIMS': {
        sensitivity: 8,
        action_if_hot: 'NEUTRAL · Claims below consensus',
        action_if_cold: 'WATCH · Rising claims = weakness',
        color_hot: '#94a3b8',
        color_cold: '#f59e0b',
    },
    'RETAIL': {
        sensitivity: 5,
        action_if_hot: 'NEUTRAL · Consumer resilient',
        action_if_cold: 'WATCH · Consumer weakening',
        color_hot: '#94a3b8',
        color_cold: '#f59e0b',
    },
    'UNEMPLOYMENT': {
        sensitivity: 15,
        action_if_hot: 'REDUCE RISK · Low unemployment = hawkish',
        action_if_cold: 'ADD RISK · Rising unemployment = dovish',
        color_hot: '#f59e0b',
        color_cold: '#22c55e',
    },
};

function getSlugForEvent(eventName: string): typeof EXPLOIT_SLUGS[string] | null {
    const upper = eventName.toUpperCase();
    for (const [key, slug] of Object.entries(EXPLOIT_SLUGS)) {
        if (upper.includes(key)) return slug;
    }
    return null;
}

function getImportanceBadge(importance: string) {
    const level = (importance || '').toUpperCase();
    if (level === 'HIGH' || level.includes('HIGH')) {
        return { label: 'HIGH IMPACT', bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' };
    }
    if (level === 'MEDIUM' || level.includes('MED')) {
        return { label: 'MEDIUM', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
    }
    return { label: 'LOW', bg: 'rgba(148,163,184,0.08)', color: '#64748b', border: 'rgba(148,163,184,0.2)' };
}

export function EconomicCalendarWithSlugs({ events, loading }: Props) {
    if (loading && events.length === 0) {
        return (
            <Card>
                <div className="card-header">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <h3 className="card-title text-base">Upcoming Economic Releases</h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-10 h-10 border-3 border-accent-purple border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-muted text-xs animate-pulse">Loading TE calendar…</span>
                </div>
            </Card>
        );
    }

    /* Filter to upcoming events using the verified boolean field */
    const upcoming = events
        .filter(e => e.is_upcoming === true)
        .slice(0, 8);

    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <h3 className="card-title text-base">Upcoming Economic Releases</h3>
                </div>
                <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    background: upcoming.length > 0 ? 'rgba(250,204,21,0.15)' : 'rgba(100,100,100,0.15)',
                    color: upcoming.length > 0 ? '#facc15' : '#94a3b8',
                    border: `1px solid ${upcoming.length > 0 ? 'rgba(250,204,21,0.3)' : 'rgba(100,100,100,0.2)'}`,
                }}>
                    {upcoming.length} upcoming
                </span>
            </div>

            {upcoming.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {upcoming.map((evt, i) => {
                        const badge = getImportanceBadge(evt.importance);
                        const slug = getSlugForEvent(evt.event);  // CORRECT: evt.event, NOT evt.event_name

                        return (
                            <div key={i} style={{
                                padding: '0.625rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                {/* Event Row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: slug ? '0.375rem' : '0' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e2e8f0' }}>
                                                {evt.event}
                                            </span>
                                            <span style={{
                                                fontSize: '0.5625rem',
                                                padding: '0.0625rem 0.375rem',
                                                borderRadius: '4px',
                                                background: badge.bg,
                                                color: badge.color,
                                                border: `1px solid ${badge.border}`,
                                                fontWeight: 700,
                                            }}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                                            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>📆 {evt.date}</span>
                                            {evt.time && <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>⏰ {evt.time}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', textAlign: 'right' }}>
                                        {/* VALUES ARE STRINGS like "1.376M" — render as-is */}
                                        {evt.consensus && (
                                            <div>
                                                <div style={{ fontSize: '0.5625rem', color: '#475569', textTransform: 'uppercase' }}>Consensus</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>{evt.consensus}</div>
                                            </div>
                                        )}
                                        {evt.forecast && (
                                            <div>
                                                <div style={{ fontSize: '0.5625rem', color: '#475569', textTransform: 'uppercase' }}>Forecast</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>{evt.forecast}</div>
                                            </div>
                                        )}
                                        {evt.previous && (
                                            <div>
                                                <div style={{ fontSize: '0.5625rem', color: '#475569', textTransform: 'uppercase' }}>Previous</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{evt.previous}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Exploitation Slug */}
                                {slug && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px dashed rgba(255,255,255,0.08)',
                                        flexWrap: 'wrap',
                                    }}>
                                        <span style={{ fontSize: '0.5625rem', color: '#64748b', fontWeight: 600 }}>EXPLOIT:</span>
                                        <span style={{
                                            fontSize: '0.5625rem',
                                            padding: '0.0625rem 0.25rem',
                                            borderRadius: '3px',
                                            background: 'rgba(96,165,250,0.12)',
                                            color: '#60a5fa',
                                            fontWeight: 600,
                                        }}>
                                            Sensitivity: {slug.sensitivity}×
                                        </span>
                                        <span style={{
                                            fontSize: '0.5625rem',
                                            padding: '0.0625rem 0.25rem',
                                            borderRadius: '3px',
                                            background: `${slug.color_hot}15`,
                                            color: slug.color_hot,
                                            fontWeight: 600,
                                        }}>
                                            If Hot → {slug.action_if_hot}
                                        </span>
                                        <span style={{
                                            fontSize: '0.5625rem',
                                            padding: '0.0625rem 0.25rem',
                                            borderRadius: '3px',
                                            background: `${slug.color_cold}15`,
                                            color: slug.color_cold,
                                            fontWeight: 600,
                                        }}>
                                            If Cold → {slug.action_if_cold}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">📭</span>
                    <span className="text-sm">No upcoming releases</span>
                    <span className="text-xs mt-1">Calendar from Trading Economics</span>
                </div>
            )}

            <div className="card-footer">
                <span style={{ fontSize: '0.625rem', color: '#475569' }}>
                    Source: Trading Economics · {events.length} total events loaded
                </span>
            </div>
        </Card>
    );
}
