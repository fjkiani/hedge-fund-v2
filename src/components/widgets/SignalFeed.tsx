import { ShieldAlert, Info, Target } from 'lucide-react';

export interface Signal {
  id: string;
  source: string;
  type: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: "HIGH" | "MEDIUM" | "LOW";
  headline: string;
  detail: string;
  data?: any;
}

interface SignalFeedProps {
  signals: Signal[];
  loading?: boolean;
}

export function SignalFeed({ signals, loading }: SignalFeedProps) {
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
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const isHigh = signal.strength === 'HIGH';
  const isBear = signal.type === 'BEARISH';
  const isBull = signal.type === 'BULLISH';
  
  const borderColor = isHigh 
    ? (isBear ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]')
    : 'border-white/10';
    
  const bgColor = isHigh
    ? (isBear ? 'bg-rose-950/20' : 'bg-emerald-950/20')
    : 'bg-[#111113]';

  const iconColor = isBear ? 'text-rose-500' : isBull ? 'text-emerald-500' : 'text-zinc-500';

  return (
    <div className={`p-5 rounded-xl border ${borderColor} ${bgColor} flex flex-col gap-3 relative overflow-hidden transition-all hover:border-white/20`}>
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
        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isHigh ? (isBear ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400') : 'bg-white/5 text-zinc-400'}`}>
          {signal.strength} SIGNAL
        </div>
      </div>

      {/* Headline & Detail */}
      <div>
        <h4 className="text-sm font-bold text-white mb-1.5 leading-snug tracking-wide">{signal.headline}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{signal.detail}</p>
      </div>

      {/* Optional Data Dump Block */}
      {signal.data && Object.keys(signal.data).length > 0 && (
         <div className="mt-2 pt-3 border-t border-white/5">
           <div className="flex flex-wrap gap-x-6 gap-y-2">
             {Object.entries(signal.data).map(([k, v]) => (
               <div key={k} className="flex items-center gap-2">
                 <span className="text-[9px] uppercase tracking-widest font-black text-zinc-600">{k.replace(/_/g, ' ')}:</span>
                 <span className="text-[10px] font-mono font-bold text-zinc-300">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
               </div>
             ))}
           </div>
         </div>
      )}
    </div>
  );
}
