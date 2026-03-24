/**
 * 📐 Pivot Levels Widget
 * 
 * Shows 4 pivot formulas (Classic/Fib/Camarilla/Woodie) + 200-EMA
 * with confluence zone detection.
 * 
 * Refresh: 24h (daily pre-open levels)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { pivotsApi } from '../../lib/api';
import { useGammaPivotContext } from '../../hooks/useGammaPivotContext';

interface PivotLevel {
    label: string;
    price: number;
    set_name: string;
    level_type: string;
}

interface ConfluenceZone {
    avg_price: number;
    level_count: number;
    sets: string[];
    levels: PivotLevel[];
}

interface PivotData {
    symbol: string;
    prior_high: number;
    prior_low: number;
    prior_close: number;
    ema_200: number | null;
    levels: PivotLevel[];
    confluence_zones: ConfluenceZone[];
    total_levels: number;
}

interface PivotLevelsProps {
    symbol?: string;
}

const SET_COLORS: Record<string, string> = {
    Classic: '#60a5fa',
    Fibonacci: '#a78bfa',
    Camarilla: '#34d399',
    Woodie: '#fbbf24',
    EMA: '#f87171',
};

export function PivotLevels({ symbol = 'SPY' }: PivotLevelsProps) {
    const [data, setData] = useState<PivotData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSet, setActiveSet] = useState<string | null>(null);
    const oracleCtx = useGammaPivotContext();

    const fetchData = useCallback(async () => {
        try {
            const json = await pivotsApi.get(symbol) as PivotData;
            setData(json);
            setError(null);
        } catch {
            setError('API unavailable');
        } finally {
            setLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        fetchData();
        // Daily refresh — pivots change at open
        const interval = setInterval(fetchData, 86400000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const levels = data?.levels || [];
    const confluenceZones = data?.confluence_zones || [];
    const sortedLevels = [...levels].sort((a, b) => b.price - a.price);

    // Filter by active set
    const filteredLevels = activeSet
        ? sortedLevels.filter(l => l.set_name === activeSet)
        : sortedLevels;


    return (
        <Card>
            <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📐 Pivot Levels
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {symbol} • {data?.total_levels || 0} levels
                    </span>
                </h2>
                <Badge variant="neutral">
                    {loading ? 'LOADING' : error ? 'ERROR' : 'DAILY'}
                </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Formula filter tabs */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setActiveSet(null)}
                        style={{
                            fontSize: '11px', padding: '3px 10px', borderRadius: '4px', border: 'none',
                            cursor: 'pointer',
                            background: activeSet === null ? 'rgba(96, 165, 250, 0.2)' : 'var(--bg-tertiary)',
                            color: activeSet === null ? '#60a5fa' : 'var(--text-muted)',
                            fontWeight: activeSet === null ? 600 : 400,
                        }}>
                        All
                    </button>
                    {['Classic', 'Fibonacci', 'Camarilla', 'Woodie'].map(set => (
                        <button
                            key={set}
                            onClick={() => setActiveSet(activeSet === set ? null : set)}
                            style={{
                                fontSize: '11px', padding: '3px 10px', borderRadius: '4px', border: 'none',
                                cursor: 'pointer',
                                background: activeSet === set ? `${SET_COLORS[set]}20` : 'var(--bg-tertiary)',
                                color: activeSet === set ? SET_COLORS[set] : 'var(--text-muted)',
                                fontWeight: activeSet === set ? 600 : 400,
                            }}>
                            {set}
                        </button>
                    ))}
                </div>

                {/* Oracle next_above / next_below directional strip */}
                {oracleCtx.isLoaded && (oracleCtx.next_above || oracleCtx.next_below) && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: '8px',
                        background: 'rgba(96, 165, 250, 0.05)', border: '1px solid rgba(96, 165, 250, 0.15)',
                        fontSize: '11px', fontFamily: 'monospace',
                    }}>
                        <span style={{ color: '#6b7280' }}>
                            {oracleCtx.next_below ? `↓ ${oracleCtx.next_below.toFixed(2)}` : '—'}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {oracleCtx.bandLabel !== '—' ? oracleCtx.bandLabel : 'SPY band'}
                        </span>
                        <span style={{ color: '#6b7280' }}>
                            {oracleCtx.next_above ? `↑ ${oracleCtx.next_above.toFixed(2)}` : '—'}
                        </span>
                    </div>
                )}

                {/* Confluence zones */}
                {confluenceZones.length > 0 && !activeSet && (
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)',
                        borderRadius: '8px', padding: '10px',
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            🎯 Confluence Zones ({confluenceZones.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {confluenceZones.slice(0, 5).map((z, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    fontSize: '12px', padding: '4px 6px', borderRadius: '4px',
                                    background: 'rgba(0,0,0,0.2)',
                                }}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        ${z.avg_price.toFixed(2)}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        {z.level_count} levels from {z.sets.join(', ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* EMA-200 */}
                {data?.ema_200 && !activeSet && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 10px', borderRadius: '6px',
                        background: 'rgba(248, 113, 113, 0.06)', borderLeft: `3px solid ${SET_COLORS.EMA}`,
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: SET_COLORS.EMA }}>
                            EMA-200
                        </span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                            ${data.ema_200.toFixed(2)}
                        </span>
                    </div>
                )}

                {/* Level list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '250px', overflowY: 'auto' }}>
                    {filteredLevels.map((l, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '4px 8px', borderRadius: '3px', fontSize: '12px',
                            borderLeft: `2px solid ${SET_COLORS[l.set_name] || '#6b7280'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: '12px', height: '12px', borderRadius: '2px', display: 'inline-block',
                                    background: l.level_type === 'RESISTANCE' ? 'rgba(239, 68, 68, 0.3)' :
                                        l.level_type === 'SUPPORT' ? 'rgba(34, 197, 94, 0.3)' :
                                            'rgba(96, 165, 250, 0.3)',
                                }} />
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {l.label}
                                </span>
                            </div>
                            <span style={{
                                fontFamily: 'monospace', fontWeight: 600,
                                color: l.level_type === 'RESISTANCE' ? '#ef4444' :
                                    l.level_type === 'SUPPORT' ? '#22c55e' :
                                        'var(--text-primary)',
                            }}>
                                ${l.price.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card-footer">
                <span className="text-text-muted" style={{ fontSize: '11px' }}>
                    {loading ? 'Loading...' : error || `Prior: H=${data?.prior_high} L=${data?.prior_low} C=${data?.prior_close}`}
                </span>
                <button onClick={fetchData} className="text-accent-blue hover:text-accent-blue/80" style={{ fontSize: '12px' }}>
                    Refresh →
                </button>
            </div>
        </Card>
    );
}
