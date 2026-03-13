/**
 * 📋 COT Positioning Widget
 * 
 * CFTC Commitments of Traders — shows specs vs commercials net positioning
 * across ES, NQ, TY, GC, CL, VX with divergence detection.
 * 
 * Refresh: 1h (weekly data, updated Fridays)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cotApi } from '../../lib/api';

interface ContractPosition {
    contract_key: string;
    contract_name: string;
    report_date: string;
    specs_net: number;
    comm_net: number;
    nonrep_net: number;
    open_interest: number;
    specs_ratio: number;
    specs_side: string;
    comm_side: string;
    divergent: boolean;
    divergence_direction: string;
    divergence_magnitude: number;
    divergence_description: string;
}

interface COTData {
    contracts: ContractPosition[];
    total_divergent: number;
    narrative: string;
}

// Contract display config
const CONTRACT_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
    ES: { emoji: '📈', label: 'E-mini S&P', color: '#60a5fa' },
    NQ: { emoji: '💻', label: 'E-mini NASDAQ', color: '#a78bfa' },
    TY: { emoji: '🏦', label: '10Y Treasury', color: '#34d399' },
    GC: { emoji: '🥇', label: 'Gold', color: '#fbbf24' },
    CL: { emoji: '🛢️', label: 'Crude Oil', color: '#f97316' },
    VX: { emoji: '⚡', label: 'VIX', color: '#f87171' },
};

function formatNet(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
}

export function COTPositioning() {
    const [data, setData] = useState<COTData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const json = await cotApi.positioning() as COTData;
            setData(json);
            setLastUpdate(new Date().toLocaleTimeString());
            setError(null);
        } catch {
            setError('API unavailable');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3600000); // 1h
        return () => clearInterval(interval);
    }, [fetchData]);

    const contracts = data?.contracts || [];
    const divCount = data?.total_divergent || 0;




    return (
        <Card>
            <div className="card-header">
                <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📋 COT Positioning
                    {divCount > 0 && (
                        <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                            background: divCount >= 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: divCount >= 3 ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${divCount >= 3 ? '#ef4444' : '#f59e0b'}`,
                        }}>
                            {divCount}/{contracts.length} DIVERGENT
                        </span>
                    )}
                </h2>
                <Badge variant={divCount >= 3 ? 'bearish' : divCount > 0 ? 'neutral' : 'bullish'}>
                    {loading ? 'LOADING' : error ? 'ERROR' : 'LIVE'}
                </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Header row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px 60px',
                    gap: '8px', padding: '4px 8px', fontSize: '10px', fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    <div>Contract</div>
                    <div style={{ textAlign: 'center' }}>Specs vs Commercials</div>
                    <div style={{ textAlign: 'right' }}>Specs Net</div>
                    <div style={{ textAlign: 'right' }}>Comm Net</div>
                    <div style={{ textAlign: 'center' }}>Signal</div>
                </div>

                {/* Contract rows */}
                {contracts.map(c => {
                    const cfg = CONTRACT_CONFIG[c.contract_key] || { emoji: '📊', label: c.contract_key, color: '#6b7280' };
                    const specsWidth = Math.abs(c.specs_net) / (Math.abs(c.specs_net) + Math.abs(c.comm_net) + 1) * 100;
                    const commsWidth = 100 - specsWidth;

                    return (
                        <div key={c.contract_key} style={{
                            display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px 60px',
                            gap: '8px', padding: '8px', borderRadius: '6px', alignItems: 'center',
                            background: c.divergent ? 'rgba(245, 158, 11, 0.06)' : 'transparent',
                            borderLeft: `3px solid ${cfg.color}`,
                        }}>
                            {/* Contract name */}
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {cfg.emoji} {c.contract_key}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {c.report_date}
                                </div>
                            </div>

                            {/* Position bar */}
                            <div style={{ display: 'flex', height: '16px', borderRadius: '3px', overflow: 'hidden', gap: '1px' }}>
                                <div style={{
                                    width: `${specsWidth}%`, minWidth: '2px',
                                    background: c.specs_net < 0 ? '#ef4444' : '#22c55e',
                                    opacity: 0.7,
                                }} />
                                <div style={{
                                    width: `${commsWidth}%`, minWidth: '2px',
                                    background: c.comm_net > 0 ? '#22c55e' : '#ef4444',
                                    opacity: 0.4,
                                }} />
                            </div>

                            {/* Specs net */}
                            <div style={{
                                textAlign: 'right', fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                                color: c.specs_net < 0 ? '#ef4444' : '#22c55e',
                            }}>
                                {c.specs_net > 0 ? '+' : ''}{formatNet(c.specs_net)}
                            </div>

                            {/* Comm net */}
                            <div style={{
                                textAlign: 'right', fontSize: '12px', fontFamily: 'monospace',
                                color: c.comm_net > 0 ? '#22c55e' : '#ef4444',
                            }}>
                                {c.comm_net > 0 ? '+' : ''}{formatNet(c.comm_net)}
                            </div>

                            {/* Divergence signal */}
                            <div style={{ textAlign: 'center' }}>
                                {c.divergent ? (
                                    <span style={{
                                        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
                                        background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b',
                                        fontWeight: 600,
                                    }}>⚠️ DIV</span>
                                ) : (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>—</span>
                                )}
                            </div>

                            {/* Expanded row: OI + NonRep + Divergence description */}
                            <div style={{
                                gridColumn: '1 / -1', display: 'flex', gap: '16px',
                                fontSize: '10px', color: 'var(--text-muted)', paddingTop: '2px',
                            }}>
                                <span>OI: {(c.open_interest || 0).toLocaleString()}</span>
                                <span>NonRep: {formatNet(c.nonrep_net || 0)}</span>
                                <span>Ratio: {((c.specs_ratio || 0) * 100).toFixed(0)}%</span>
                                {c.divergent && c.divergence_description && (
                                    <span style={{ color: '#f59e0b' }}>{c.divergence_description}</span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Narrative from backend */}
                {data?.narrative && (
                    <div style={{
                        marginTop: '12px', padding: '10px 14px', borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.15)',
                        fontSize: '11px', lineHeight: '1.5', color: 'var(--text-secondary)',
                    }}>
                        📊 {data.narrative}
                    </div>
                )}

                {/* Cross-asset insight */}
                {divCount >= 2 && (
                    <div style={{
                        marginTop: '8px', padding: '8px 12px', borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontSize: '11px', color: '#f59e0b',
                    }}>
                        ⚠️ {divCount} contracts divergent — specs vs commercials disagree on {divCount} markets simultaneously
                    </div>
                )}
            </div>

            <div className="card-footer">
                <span className="text-text-muted" style={{ fontSize: '11px' }}>
                    {loading ? 'Loading...' : error || `Updated ${lastUpdate} • Weekly data`}
                </span>
                <button onClick={fetchData} className="text-accent-blue hover:text-accent-blue/80" style={{ fontSize: '12px' }}>
                    Refresh →
                </button>
            </div>
        </Card>
    );
}
