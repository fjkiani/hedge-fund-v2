/**
 * UnifiedBriefView — Alpha Terminal V8.0 (Modularized)
 *
 * ALL data comes from useMasterBrief() → live /brief/master API.
 * ALL oracle briefings come from POST /oracle/event-brief → backend Groq.
 * ZERO hardcoded constants. Every value is live.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Activity, AlertOctagon, Globe, Sun, Moon, Layers } from 'lucide-react';
import { Lock } from 'lucide-react';

import { useMasterBrief } from '../../hooks/useMasterBrief';
import { useOracleBrief } from '../../hooks/useOracleBrief';
import { OracleContext } from './OracleContext';

// Components
import { buildForecastCards, buildDivergenceCards } from './terminal/helpers';
import { LiveMacroCommandBar } from './terminal/MacroCommandBar';
import { LiveStrategyCardRow } from './terminal/StrategyCardRow';
import { LiveTacticalSection } from './terminal/TacticalSection';
import { LivePreSignalSection } from './terminal/PreSignalSection';
import { MacroSnapshotCard, DivergenceCard } from './terminal/ForecastGrid';
import { LiveOracleStrip } from './terminal/OracleStrip';
import { BreachAlert } from './terminal/BreachAlert';

export function UnifiedBriefView() {
  const { data, loading, error } = useMasterBrief(120000);
  const { oracle } = useOracleBrief(data);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const forecastCards = useMemo(() => data ? buildForecastCards(data) : [], [data]);
  const divergenceCards = useMemo(() => data ? buildDivergenceCards(data) : [], [data]);

  const handleToggle = useCallback((slug: string | null) => {
    setExpandedSlug(prev => prev === slug ? null : slug);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-6">
          <Activity className="w-12 h-12 text-cyan-500 animate-pulse" />
          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.6em]">Establish Node Sync</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <AlertOctagon className="w-10 h-10 text-rose-500" />
          <span className="text-sm text-rose-500 font-black uppercase">Uplink Failed: {error || 'No data'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] text-zinc-900 dark:text-white font-sans selection:bg-cyan-500/20 overflow-hidden flex flex-col transition-colors duration-500">

        {/* Nav */}
        <nav className="h-14 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#08080a] flex items-center justify-between px-8 z-[200]">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600/10 rounded flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900 dark:text-white">Alpha <span className="text-blue-500">Terminal</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-zinc-500"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-widest pl-4 border-l border-zinc-200 dark:border-zinc-800">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Uplink_Live
            </div>
          </div>
        </nav>

        {/* Main */}
        <OracleContext.Provider value={oracle}>
          <main className="flex-1 p-10 overflow-y-auto scrollbar-hide relative">
            <div className="max-w-full mx-auto space-y-10 pb-20 px-4">

              <BreachAlert data={data} />
              <LiveOracleStrip />
              <LiveMacroCommandBar data={data} />
              <LiveStrategyCardRow data={data} expandedSlug={expandedSlug} onToggle={handleToggle} />
              <LiveTacticalSection data={data} expandedSlug={expandedSlug} onToggle={handleToggle} />
              <LivePreSignalSection data={data} expandedSlug={expandedSlug} onToggle={handleToggle} />

              {/* Execution Forecast Grid */}
              <div className="space-y-12 pt-12 border-t border-zinc-200 dark:border-zinc-800">
                {forecastCards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">Execution Forecast Grid</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {forecastCards.map((item) => (
                        <MacroSnapshotCard key={item.slug} item={item} isExpanded={expandedSlug === item.slug} onToggle={handleToggle} briefData={data} />
                      ))}
                    </div>
                  </section>
                )}

                {divergenceCards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Layers className="w-5 h-5 text-purple-500" />
                      <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">Institutional Divergence Grid</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {divergenceCards.map((item) => (
                        <DivergenceCard key={item.slug} item={item} isExpanded={expandedSlug === item.slug} onToggle={handleToggle} briefData={data} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </main>
        </OracleContext.Provider>

        {/* Footer */}
        <footer className="h-10 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#08080a] flex items-center justify-between px-8 text-[8px] font-mono text-zinc-500 dark:text-zinc-600 uppercase tracking-widest relative z-[100]">
          <div className="flex gap-10">
            <span className="flex items-center gap-2 tracking-tighter"><Lock className="w-2.5 h-2.5" /> SECURE_UPLINK_v8</span>
            <span className="flex items-center gap-2 tracking-tighter"><Activity className="w-2.5 h-2.5" /> SCAN: {data.scan_time?.toFixed(1)}s</span>
          </div>
          <span>&copy; 2026 ALPHA TERMINAL // UPLINK_ACTIVE_V8</span>
        </footer>
      </div>
    </div>
  );
}

export default UnifiedBriefView;
