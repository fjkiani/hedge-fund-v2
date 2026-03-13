import { PriceDisplay } from './PriceDisplay';

interface SignalRowProps {
  symbol: string;
  action: string;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  riskReward: number;
  confidence: number;
  type: string;
  reasoning?: string;
  isMaster?: boolean;
  timestamp?: string;
  compact?: boolean;
}

export function SignalRow({
  symbol, action, entryPrice, targetPrice, stopPrice, riskReward,
  confidence, type, reasoning, isMaster, timestamp, compact
}: SignalRowProps) {
  const isBuy = action === 'BUY' || action === 'LONG';
  const isHold = action === 'WATCH' || action === 'HOLD';
  const colorToken = isHold ? 'blue' : isBuy ? 'green' : 'red';
  
  return (
    <div className={`glass-card p-3 ${isMaster ? `glow-${colorToken} border-opacity-30 border-accent-${colorToken}` : 'glow-neutral'}`}>
      <div className={`flex items-center justify-between gap-4 ${compact ? 'flex-wrap' : ''}`}>
        
        {/* Left: Action & Symbol */}
        <div className="flex items-center gap-3 min-w-[120px]">
          <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-full bg-accent-${colorToken}/10 text-accent-${colorToken} border border-accent-${colorToken}/20`}>
            {isHold ? '👀' : isBuy ? '▲' : '▼'}
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight flex items-center gap-2">
              {action} {symbol}
              {isMaster && <span className="text-xs px-1.5 py-0.5 bg-accent-gold/20 text-accent-gold rounded uppercase text-[10px] border border-accent-gold/30">Master</span>}
            </div>
            {timestamp && <div className="text-[10px] text-text-muted font-mono">{new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
          </div>
        </div>

        {/* Center: Prices */}
        <div className="flex items-center gap-4 lg:gap-8 flex-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Entry</span>
            <PriceDisplay value={entryPrice} size={compact ? 'sm' : 'md'} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Target</span>
            <PriceDisplay value={targetPrice} size={compact ? 'sm' : 'md'} accent="green" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Stop</span>
            <PriceDisplay value={stopPrice} size={compact ? 'sm' : 'md'} accent="red" />
          </div>
        </div>

        {/* Right: R/R & Conf */}
        <div className="flex items-center gap-4 text-right min-w-[100px] justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">R/R</span>
            <span className="font-mono text-accent-gold text-sm">{riskReward > 0 ? riskReward.toFixed(1) : '—'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Conf</span>
            <span className="font-mono text-white text-sm">{confidence}%</span>
          </div>
        </div>
      </div>
      
      {/* Reasoning Row */}
      {reasoning && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-start gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-secondary mt-0.5 uppercase tracking-wide shrink-0">
            {type.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-text-secondary flex-1 leading-relaxed">
            {reasoning}
          </span>
        </div>
      )}
    </div>
  );
}
