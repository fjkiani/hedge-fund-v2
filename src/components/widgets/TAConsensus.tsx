/**
 * 📊 TA Consensus Widget
 * 
 * Multi-indicator technical analysis consensus:
 * RSI, Stochastic, CCI, Williams%R, MACD, ADX, ATR, BB%B
 * Plus Bollinger Squeeze and Ichimoku cloud detection.
 * 
 * Refresh: 30s (derived from latest price data)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { taApi } from '../../lib/api';

interface IndicatorValue {
    name: string;
    value: number;
    signal: string;
    category: string;
}

interface TAData {
    symbol: string;
    indicators: IndicatorValue[];
    oversold_count: number;
    total_indicators: number;
    consensus: string;
    bb_squeeze: boolean;
    above_ichimoku_cloud: boolean;
    narrative: string;
}

interface TAConsensusProps {
    symbol?: string;
    onDrillDown?: (item: any) => void;
    activeSlug?: string;
}

const SIGNAL_STYLES: Record<string, { bg: string; color: string }> = {
    OVERSOLD: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
    OVERBOUGHT: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
    BEARISH: { bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171' },
    BULLISH: { bg: 'rgba(34, 197, 94, 0.1)', color: '#34d399' },
    NEUTRAL: { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' },
};

const CONSENSUS_STYLES: Record<string, { bg: string; border: string; color: string; label: string }> = {
    OVERSOLD: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', color: '#ef4444', label: '🔴 OVERSOLD' },
    OVERBOUGHT: { bg: 'rgba(34, 197, 94, 0.12)', border: '#22c55e', color: '#22c55e', label: '🟢 OVERBOUGHT' },
    MIXED: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', color: '#f59e0b', label: '🟡 MIXED' },
    NEUTRAL: { bg: 'rgba(107, 114, 128, 0.08)', border: '#6b7280', color: '#6b7280', label: '⚪ NEUTRAL' },
};

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
    momentum: { emoji: '🏃', label: 'Momentum' },
    volatility: { emoji: '📊', label: 'Volatility' },
    trend: { emoji: '📈', label: 'Trend' },
};

export function TAConsensus({ symbol = 'SPY', onDrillDown, activeSlug }: TAConsensusProps) {
    const [data, setData] = useState<TAData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const json = await taApi.consensus(symbol) as TAData;
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
        const interval = setInterval(fetchData, 30000); // 30s
        return () => clearInterval(interval);
    }, [fetchData]);

    const indicators = data?.indicators || [];
    const cs = CONSENSUS_STYLES[data?.consensus || 'NEUTRAL'];

    // Group by category
    const grouped = indicators.reduce<Record<string, IndicatorValue[]>>((acc, ind) => {
        if (!acc[ind.category]) acc[ind.category] = [];
        acc[ind.category].push(ind);
        return acc;
    }, {});

    return (
        <Card>
            <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 TA Consensus
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>{symbol}</span>
                </h2>
                <Badge variant={data?.consensus === 'OVERSOLD' ? 'bearish' : data?.consensus === 'OVERBOUGHT' ? 'bullish' : 'neutral'}>
                    {loading ? 'LOADING' : error ? 'ERROR' : '30s'}
                </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Consensus banner */}
                {data && (() => {
                    const slug = `TA:${symbol}`;
                    const isActive = activeSlug === slug;
                    return (
                    <div 
                        onClick={() => onDrillDown?.({
                            slug,
                            title: `TA Consensus - ${symbol}`,
                            label: 'Technical Analysis Consensus',
                            actual: data.consensus,
                            signal: data.consensus,
                            surprise: `${data.oversold_count}/${data.total_indicators} OS`
                        })}
                        className="hover:bg-white/[0.05] transition-colors"
                        style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', borderRadius: '8px',
                        background: isActive ? 'rgba(96, 165, 250, 0.15)' : cs.bg, 
                        border: isActive ? '1px solid rgba(96, 165, 250, 0.3)' : `1px solid ${cs.border}`,
                        cursor: 'pointer',
                    }}>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: cs.color }}>
                                {cs.label}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {data.oversold_count}/{data.total_indicators} oversold indicators
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {data.bb_squeeze && (
                                <span style={{
                                    fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                                    background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                                    fontWeight: 700, animation: 'pulse 2s ease-in-out infinite',
                                }}>
                                    🔥 SQUEEZE
                                </span>
                            )}
                            <span style={{
                                fontSize: '10px', padding: '3px 8px', borderRadius: '4px',
                                background: data.above_ichimoku_cloud ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: data.above_ichimoku_cloud ? '#22c55e' : '#ef4444',
                                fontWeight: 600,
                            }}>
                                {data.above_ichimoku_cloud ? '☁️ Above' : '☁️ Below'}
                            </span>
                        </div>
                    </div>
                )})()}

                {/* Indicator groups */}
                {Object.entries(grouped).map(([category, inds]) => {
                    const catConfig = CATEGORY_LABELS[category] || { emoji: '📊', label: category };
                    return (
                        <div key={category}>
                            <div style={{
                                fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
                                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px',
                            }}>
                                {catConfig.emoji} {catConfig.label}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {inds.map((ind, i) => {
                                    const ss = SIGNAL_STYLES[ind.signal] || SIGNAL_STYLES.NEUTRAL;
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '5px 8px', borderRadius: '4px',
                                            background: ind.signal !== 'NEUTRAL' ? ss.bg : 'transparent',
                                        }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {ind.name}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {typeof ind.value === 'number' ? ind.value.toFixed(ind.value > 100 || ind.value < -100 ? 1 : 2) : ind.value}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
                                                    background: ss.bg, color: ss.color, fontWeight: 600, minWidth: '65px', textAlign: 'center',
                                                }}>
                                                    {ind.signal}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card-footer">
                <span className="text-text-muted" style={{ fontSize: '11px' }}>
                    {loading ? 'Loading...' : error || `${indicators.length} indicators • 30s refresh`}
                </span>
                <button onClick={fetchData} className="text-accent-blue hover:text-accent-blue/80" style={{ fontSize: '12px' }}>
                    Refresh →
                </button>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
        </Card>
    );
}
