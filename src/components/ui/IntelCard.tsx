import React from 'react';

interface IntelSubStat {
  label: string;
  value: string | React.ReactNode;
}

interface IntelCardProps {
  icon: string;
  title: string;
  stat: string | React.ReactNode;
  description: string;
  subStats?: IntelSubStat[];
  accent: 'green' | 'red' | 'blue' | 'gold' | 'orange' | 'purple' | 'neutral';
  live?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  expandedContent?: React.ReactNode;
}

export function IntelCard({ 
  icon, 
  title, 
  stat, 
  description, 
  subStats, 
  accent, 
  live,
  isActive = false,
  onClick,
  expandedContent
}: IntelCardProps) {
  // Base classes for the card
  const baseClasses = `glass-card glow-${accent} transition-all duration-300 relative overflow-hidden`;
  
  // Interactive / Active state classes
  const interactiveClasses = onClick ? 'cursor-pointer hover:bg-white/5' : '';
  const activeClasses = isActive 
    ? `ring-1 ring-${accent === 'neutral' ? 'white/30' : 'accent-' + accent + '/50'} bg-white/10 shadow-[0_0_30px_rgba(var(--color-${accent}),0.15)] scale-[1.02] z-10` 
    : 'opacity-80 hover:opacity-100 scale-100';

  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${activeClasses}`}
      onClick={onClick}
    >
      {/* Active Indicator Strip */}
      {isActive && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-accent-${accent === 'neutral' ? 'white' : accent} shadow-[0_0_10px_rgba(var(--color-${accent}),0.8)]`} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {live && <span className="live-indicator" />}
          <span className="text-lg">{icon}</span>
          <span className="label-sm text-white">{title}</span>
        </div>
      </div>
      
      {/* Main Stat */}
      <div className="my-3">
        {typeof stat === 'string' ? <div className="stat-xl">{stat}</div> : stat}
      </div>
      
      {/* Sub Stats Row */}
      {subStats && subStats.length > 0 && (
        <div className="flex items-center gap-4 mb-3 border-b border-white/5 pb-3">
          {subStats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase tracking-wide">{s.label}</span>
              <span className="font-mono text-sm text-text-secondary bg-black/20 px-2 py-0.5 rounded">{s.value}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Narrative */}
      <p className="body-sm text-text-secondary">{description}</p>

      {/* Expanded Content (Only visible when active) */}
      {isActive && expandedContent && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
          {expandedContent}
        </div>
      )}
    </div>
  );
}
