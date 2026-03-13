/**
 * FinnhubNewsPanel — News catalysts behind hot tickers
 * Signal: "Why are people trading this ticker? Earnings / legal / M&A"
 */

import { Card } from '../../ui/Card';
import type { FinnhubNewsItem } from '../types';

interface Props {
    news: Record<string, FinnhubNewsItem[]>;
}

export function FinnhubNewsPanel({ news }: Props) {
    const tickers = Object.keys(news || {}).filter(t => (news[t] || []).length > 0);

    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📰</span>
                    <h3 className="card-title text-base">News Catalysts</h3>
                </div>
                <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                }}>
                    Finnhub
                </span>
            </div>

            {tickers.length > 0 ? (
                <div className="space-y-3">
                    {tickers.map(ticker => (
                        <div key={ticker}>
                            <div className="flex items-center gap-2 mb-1">
                                <span style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    color: '#a78bfa',
                                }}>
                                    {ticker}
                                </span>
                                <span style={{
                                    fontSize: '0.625rem',
                                    color: '#64748b',
                                }}>
                                    {news[ticker].length} headline{news[ticker].length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {news[ticker].slice(0, 3).map((item, i) => (
                                    <a
                                        key={i}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'block',
                                            padding: '0.375rem 0.625rem',
                                            borderRadius: '0.375rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.04)',
                                            textDecoration: 'none',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.04)';
                                        }}
                                    >
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#e2e8f0',
                                            lineHeight: 1.4,
                                        }}>
                                            {item.headline}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span style={{ fontSize: '0.625rem', color: '#64748b' }}>
                                                {item.source}
                                            </span>
                                            {item.datetime && (
                                                <span style={{ fontSize: '0.625rem', color: '#475569' }}>
                                                    {new Date(item.datetime * 1000).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">📭</span>
                    <span className="text-sm">No news catalysts detected</span>
                    <span className="text-xs mt-1">Finnhub scans company news for hot tickers</span>
                </div>
            )}
        </Card>
    );
}
