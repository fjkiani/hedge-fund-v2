import { PriceDisplay } from './PriceDisplay';

interface TrapCardProps {
  type: string;
  emoji: string;
  priceMin: number;
  priceMax: number;
  conviction: number;
  narrative: string;
  dataPoint?: string;
  sources: string[];
  accent: 'green' | 'red' | 'yellow' | 'purple' | 'neutral';
}

export function TrapCard({ type, emoji, priceMin, priceMax, conviction, narrative, dataPoint, sources, accent }: TrapCardProps) {
  // Normalize accent logic for yellow
  const cssAccent = accent === 'yellow' ? 'gold' : accent;
  
  return (
    <div className={`glass-card glow-${cssAccent} p-0 overflow-hidden`}>
      {/* Accent Stripe is handled by glow-[accent]::before from CSS */}
      <div className="p-4 pl-5">
        
        {/* Top Row: Type, Price Range, Conviction */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <span className="font-bold text-white uppercase tracking-wide">{type.replace(/_/g, ' ')}</span>
          </div>
          
          <div className="font-mono text-white bg-black/20 px-3 py-1 rounded-md border border-white/5">
            <PriceDisplay value={priceMin} size="md" showDash={false} />
            <span className="mx-2 text-text-muted">—</span>
            <PriceDisplay value={priceMax} size="md" showDash={false} />
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-text-muted uppercase tracking-wider mr-1">Conviction</span>
            <div className="conviction-row" style={{ color: `var(--accent-${cssAccent})` }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`conviction-dot ${i <= conviction ? 'conviction-dot--filled' : 'conviction-dot--empty'}`} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Row: Narrative, Data Point, Sources */}
        <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
          <p className="body-md text-white">{narrative}</p>
          
          <div className="flex flex-wrap items-center gap-3">
            {dataPoint && (
              <span className="font-mono text-xs text-text-muted bg-black/30 px-2 py-1 rounded border border-white/5">
                {dataPoint}
              </span>
            )}
            
            <div className="flex items-center gap-1 ml-auto">
              {sources.map(src => (
                <span key={src} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/10">
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
