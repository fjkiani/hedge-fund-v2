import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Brain } from 'lucide-react';
import type { MasterBrief } from '../../../hooks/useMasterBrief';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function InlineOracleBriefing({ slug, title, briefData }: {
  slug: string; title: string; briefData: MasterBrief | null;
}) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchBriefing = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/oracle/event-brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: slug,
            brief: briefData ?? undefined,
          }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const result = await r.json();
        if (!cancelled) {
          setAnalysis(
            result.summary
              ? `${result.summary}\n\n💡 ${result.trade_implication || ''}`
              : result.analysis || 'No analysis available.'
          );
        }
      } catch {
        if (!cancelled) setAnalysis('Oracle uplink offline.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBriefing();
    return () => { cancelled = true; };
  }, [slug, briefData]);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-3 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-1">
            <RefreshCw className="w-3 h-3 text-cyan-500 animate-spin" />
            <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">Running Scan...</span>
          </div>
        ) : (
          <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-800 text-[10px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap font-sans">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">NYX Oracle Brief</span>
            </div>
            {analysis}
          </div>
        )}
      </div>
    </motion.div>
  );
}
