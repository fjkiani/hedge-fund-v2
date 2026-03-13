/**
 * TavilyResearchPanel — Real-time web research context from Tavily
 */

import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import type { TavilyContext } from '../types';

interface TavilyResearchPanelProps {
    context: TavilyContext | null;
}

export function TavilyResearchPanel({ context }: TavilyResearchPanelProps) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <h3 className="card-title text-base">Tavily Research</h3>
                </div>
                {context && (
                    <Badge variant={context.relevance_score > 0.7 ? 'bullish' : 'neutral'}>
                        {(context.relevance_score * 100).toFixed(0)}% relevance
                    </Badge>
                )}
            </div>
            {context ? (
                <div className="space-y-3">
                    <div className="p-2 bg-bg-primary rounded border border-border-subtle">
                        <span className="text-xs text-text-muted">Query: </span>
                        <span className="text-xs text-accent-blue font-mono">{context.query}</span>
                    </div>

                    <div className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
                        <div className="text-xs text-text-secondary leading-relaxed">
                            {context.summary}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-text-muted uppercase">Sources</div>
                        {context.sources.slice(0, 3).map((src, i) => (
                            <a
                                key={i}
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-accent-blue hover:text-accent-blue/80 truncate transition"
                            >
                                {src}
                            </a>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">🌐</span>
                    <span className="text-sm">No Tavily enrichment triggered</span>
                    <span className="text-xs mt-1">Activates when politician buys ≥ 2 or insider count ≥ 3</span>
                </div>
            )}
            <div className="card-footer">
                <span>Tavily API</span>
                <span className="text-text-muted">1000 credits/month</span>
            </div>
        </Card>
    );
}
