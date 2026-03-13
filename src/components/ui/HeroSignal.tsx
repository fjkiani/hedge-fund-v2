import { PriceDisplay } from './PriceDisplay';

interface HeroSignalProps {
  action: 'LONG' | 'SHORT' | 'WATCH';
  symbol: string;
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  riskReward: number;
  reasoning?: string[];
  timestamp?: string;
}

export function HeroSignal({
  action, symbol, confidence, entryPrice, targetPrice, stopPrice, riskReward, reasoning, timestamp
}: HeroSignalProps) {
  const isBuy = action === 'LONG';
  const colorToken = action === 'WATCH' ? 'blue' : isBuy ? 'green' : 'red';
  
  return (
    <div className="relative rounded-2xl p-[1px] mb-6 overflow-hidden">
      {/* Background glow gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r from-accent-${colorToken}/30 via-transparent to-transparent opacity-50 blur-xl`} />
      
      {/* Glass card content */}
      <div className={`relative glass-card border border-white/10 glow-${colorToken} !rounded-[15px]`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left: Action & Symbol */}
          <div className="flex flex-col flex-shrink-0 min-w-[200px]">
            <div className={`flex items-center gap-2 text-3xl font-black text-accent-${colorToken} tracking-tight uppercase`}>
              <span className="live-indicator !w-3 !h-3 !mr-0 mb-1" style={{ background: `var(--accent-${colorToken})`, animation: 'pulse-live-dot 1s infinite' }} />
              {action} TRIGGERED
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl font-bold text-white tracking-widest">{symbol}</span>
              <span className="text-xs px-3 py-1 bg-white/10 text-text-primary rounded-full border border-white/10 font-bold tracking-wide">
                CONFIDENCE {confidence}%
              </span>
            </div>
          </div>

          {/* Center: Prices (Frosted Blocks) */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            {[
              { label: 'ENTRY', value: entryPrice, accent: 'default' },
              { label: 'TARGET', value: targetPrice, accent: 'green' },
              { label: 'STOP', value: stopPrice, accent: 'red' },
            ].map((p, i) => (
              <div key={i} className={`flex flex-col justify-center items-center py-3 px-6 rounded-xl bg-black/20 border border-white/5 glow-${p.accent === 'default' ? 'neutral' : p.accent}`}>
                <span className="text-[10px] text-text-muted uppercase tracking-widest mb-1">{p.label}</span>
                <PriceDisplay value={p.value} size="lg" accent={p.accent as any} showDash={true} />
              </div>
            ))}
          </div>

          {/* Right: R/R & Timestamp */}
          <div className="flex flex-col items-end flex-shrink-0 min-w-[120px]">
            <span className="text-[14px] text-accent-gold uppercase tracking-widest mb-1 font-bold">R/R RATIO</span>
            <span className="stat-xl text-accent-gold mb-2">{riskReward > 0 ? riskReward.toFixed(1) : '—'}:1</span>
            {timestamp && <span className="font-mono text-xs text-text-muted">{new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
          </div>
          
        </div>

        {/* Bottom edge: RR Progress Bar (visual flair) */}
        {riskReward > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <div className={`h-full bg-accent-${colorToken} opacity-80`} style={{ width: `${Math.min(100, Math.max(10, riskReward * 20))}%` }} />
          </div>
        )}

        {/* Reasoning Row */}
        {reasoning && reasoning.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <ul className="text-xs text-text-secondary leading-relaxed list-disc pl-4 space-y-1">
              {reasoning.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
