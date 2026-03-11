import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Brain } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { agentsApi, narrativeApi } from '../../lib/api';
import { useEffect, useState } from 'react';

interface NarrativeMemory {
  daily_context: {
    outlook: string;
    key_themes: string[];
    risk_assessment: string;
  } | null;
  market_regime: {
    regime: string;
    vix_level: number | null;
  } | null;
}

interface PreviousSession {
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
  narrative_chain: Array<{ date: string; narrative: string }> | null;
}

export function NarrativeBrain() {
  const [narrative, setNarrative] = useState<string>('Loading narrative...');
  const [confidence, setConfidence] = useState<number>(0);
  const [memory, setMemory] = useState<NarrativeMemory | null>(null);
  const [prevSession, setPrevSession] = useState<PreviousSession | null>(null);
  const { connected, data } = useWebSocket({ channel: 'narrative' });

  useEffect(() => {
    Promise.allSettled([
      agentsApi.getNarrative(),
      narrativeApi.getMemory(),
      narrativeApi.getPreviousSession(),
    ]).then(([narrativeRes, memoryRes, prevRes]) => {
      if (narrativeRes.status === 'fulfilled') {
        const r = narrativeRes.value as any;
        setNarrative(r.narrative || 'No narrative available');
        setConfidence(r.confidence || 0);
      } else {
        setNarrative('Narrative unavailable — endpoint timed out or errored');
      }
      if (memoryRes.status === 'fulfilled') {
        setMemory(memoryRes.value as NarrativeMemory);
      }
      if (prevRes.status === 'fulfilled') {
        setPrevSession(prevRes.value as PreviousSession);
      }
    });
  }, []);

  useEffect(() => {
    if (data && data.type === 'narrative') {
      setNarrative(data.narrative?.narrative || narrative);
      setConfidence(data.narrative?.confidence || confidence);
    }
  }, [data]);

  const getOutlookColor = (outlook: string) => {
    switch (outlook?.toUpperCase()) {
      case 'TRENDING_UP': return 'text-accent-green';
      case 'TRENDING_DOWN': return 'text-accent-red';
      case 'CHOPPY': return 'text-accent-orange';
      default: return 'text-text-secondary';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'HIGH': return 'border-accent-red/40 bg-accent-red/10 text-accent-red';
      case 'ELEVATED': return 'border-accent-orange/40 bg-accent-orange/10 text-accent-orange';
      case 'LOW': return 'border-accent-green/40 bg-accent-green/10 text-accent-green';
      default: return 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue';
    }
  };

  return (
    <Card>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-purple" />
          <h2 className="card-title">Narrative Brain</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{confidence.toFixed(0)}%</Badge>
          {connected ? (
            <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-accent-red rounded-full" />
          )}
        </div>
      </div>

      {/* Cross-Session Context from narrative_memory.db */}
      {memory?.daily_context && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${getOutlookColor(memory.daily_context.outlook)}`}>
                {memory.daily_context.outlook === 'TRENDING_DOWN' ? '📉' :
                  memory.daily_context.outlook === 'TRENDING_UP' ? '📈' : '📊'}
                {' '}{memory.daily_context.outlook?.replace('_', ' ')}
              </span>
              {memory.market_regime?.vix_level && (
                <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary">
                  VIX {memory.market_regime.vix_level.toFixed(1)}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRiskColor(memory.daily_context.risk_assessment)}`}>
              {memory.daily_context.risk_assessment} RISK
            </span>
          </div>

          {/* Key Themes Chips */}
          {memory.daily_context.key_themes?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {memory.daily_context.key_themes.map((theme, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20"
                >
                  {theme}
                </span>
              ))}
            </div>
          )}

          {/* Regime Badge */}
          {memory.market_regime?.regime && (
            <div className="text-xs text-text-muted">
              Regime: <span className="text-text-secondary font-mono">{memory.market_regime.regime}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="prose prose-invert max-w-none">
          <p className="text-text-primary leading-relaxed">
            {narrative}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-purple transition-all duration-300"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-sm text-text-muted font-mono">{confidence}%</span>
        </div>
      </div>

      <div className="card-footer">
        <span className="text-text-muted">AI Synthesis</span>
        <div className="flex items-center gap-3">
          {prevSession?.has_data && (
            <span className="text-[10px] text-text-muted">📅 Yesterday's context loaded</span>
          )}
          <button className="text-accent-purple hover:text-accent-purple/80">Ask AI →</button>
        </div>
      </div>
    </Card>
  );
}
