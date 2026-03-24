import { ShieldAlert, Info, Target, Zap, Clock } from 'lucide-react';

/**
 * ZETA-CORE: KILL CHAIN SIGNAL INTERFACE (v2026.3.24)
 * Standardizes institutional blood in the water.
 */
export interface KillChainSignal {
  signal_id: string;        // Unique ID: [source]-[date]-[counter]
  source: 'TRAP_MATRIX' | 'DARK_POOL' | 'GAMMA' | 'COT' | 'ORACLE';
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'SQUEEZE' | 'WATCH';
  strength: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  headline: string;        // The "Hook" for the HUD
  detail: string;          // The reasoning (what the suits missed)
  action_trigger: string;  // The "If X, then Execute Y" instruction
  data: {
    spot_price: number;
    key_level_low?: number;
    key_level_high?: number;
    gex_notional?: number;
    short_vol_pct?: number;
    spec_net_position?: number;
    [key: string]: any; // Allow extensions for display
  };
  metadata: {
    timestamp: string;
    conviction_score: number; // 1-10
    is_live: boolean;
  };
}

interface SignalFeedProps {
  signals: KillChainSignal[];
  loading?: boolean;
  selectedSignalId?: string | null;
  onSelect?: (signal: KillChainSignal) => void;
}

export function SignalFeed({ signals, loading, selectedSignalId, onSelect }: SignalFeedProps) {
  if (loading) {
     return (
       <div className="flex flex-col gap-4 animate-pulse">
         {[1, 2, 3].map(i => (
           <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
         ))}
       </div>
     );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-zinc-500 border border-white/5 border-dashed rounded-2xl bg-black/20">
        <Target className="w-8 h-8 mb-4 opacity-50" />
        <span className="text-[10px] uppercase tracking-widest font-black">No Active Signals Detected</span>
        <span className="text-xs mt-2">The kill chain registry is currently empty.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {signals.map((signal) => (
        <SignalCard 
          key={signal.signal_id} 
          signal={signal} 
          isSelected={selectedSignalId === signal.signal_id}
          onClick={() => onSelect?.(signal)}
        />
      ))}
    </div>
  );
}

function SignalCard({ signal, isSelected, onClick }: { signal: KillChainSignal, isSelected?: boolean, onClick?: () => void }) {
  const isHigh = signal.strength === 'HIGH' || signal.strength === 'CRITICAL';
  const isBear = signal.type === 'BEARISH';
  const isBull = signal.type === 'BULLISH';
  const isSqueeze = signal.type === 'SQUEEZE';
  
  const baseBorder = isSelected
    ? 'border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
    : isHigh 
      ? (isBear ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]')
      : 'border-white/10';
    
  const bgColor = isSelected
    ? 'bg-cyan-950/20'
    : isHigh
      ? (isBear ? 'bg-rose-950/20' : 'bg-emerald-950/20')
      : 'bg-[#111113]';

  const iconColor = isBear ? 'text-rose-500' : isBull ? 'text-emerald-500' : isSqueeze ? 'text-purple-500' : 'text-zinc-500';

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border ${baseBorder} ${bgColor} flex flex-col gap-3 relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:border-white/30' : ''}`}
    >
      {isSelected && (
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_12px_#06b6d4]" />
      )}

      {/* Top row: Source + Strength */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHigh ? <ShieldAlert className={`w-4 h-4 ${iconColor}`} /> : <Info className={`w-4 h-4 ${iconColor}`} />}
          <span className={`text-[10px] font-black uppercase tracking-widest ${iconColor}`}>
            {signal.source}
          </span>
          <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-wider px-2 border-l border-white/10">
            {signal.type}
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isSelected ? 'bg-cyan-500/20 text-cyan-400' : isHigh ? (isBear ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400') : 'bg-white/5 text-zinc-400'}`}>
          {signal.strength}
        </div>
      </div>

      {/* Headline & Detail */}
      <div>
        <h4 className={`text-sm font-bold mb-1.5 leading-snug tracking-wide ${isSelected ? 'text-cyan-50' : 'text-white'}`}>{signal.headline}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{signal.detail}</p>
      </div>

      {/* Action Trigger Block */}
      {signal.action_trigger && (
        <div className={`mt-2 p-3 rounded-lg border ${isSelected ? 'bg-cyan-950/30 border-cyan-500/20' : 'bg-black/30 border-white/5'}`}>
          <div className="flex items-start gap-2">
            <Zap className={`w-3.5 h-3.5 mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-amber-500'}`} />
            <div>
              <span className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">Execution Trigger</span>
              <span className={`text-[11px] font-mono leading-relaxed ${isSelected ? 'text-cyan-200' : 'text-amber-200/80'}`}>{signal.action_trigger}</span>
            </div>
          </div>
        </div>
      )}

      {/* Meta + Data Dump Block */}
      <div className="mt-2 pt-3 border-t border-white/5 flex items-end justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {signal.data && Object.entries(signal.data).map(([k, v]) => {
            if (v == null) return null;
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="text-[8px] uppercase tracking-widest font-black text-zinc-600">{k.replace(/_/g, ' ')}:</span>
                <span className="text-[10px] font-mono font-bold text-zinc-300">{typeof v === 'number' && Math.abs(v) > 1000 ? v.toLocaleString() : String(v)}</span>
              </div>
            );
          })}
        </div>
        {signal.metadata && (
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Clock className="w-3 h-3" />
            <span className="text-[9px] font-mono">{new Date(signal.metadata.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        )}
      </div>
    </div>
  );
}
