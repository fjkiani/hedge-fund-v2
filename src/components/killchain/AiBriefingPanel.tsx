import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Crosshair, ShieldAlert, MessageSquareCode, FileSearch, ExternalLink } from 'lucide-react';
import { AiBriefingItem } from './types';

interface Props {
  item: AiBriefingItem;
  onClose: () => void;
}

export const AiBriefingPanel: React.FC<Props> = ({ item, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    setAnalysis(null);
    setSources([]);

    const run = async () => {
      try {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? '';
        if (!apiKey) {
          setAnalysis('ORACLE_UPLINK_FAILURE: VITE_GEMINI_API_KEY not configured.');
          return;
        }

        const systemPrompt =
          'Act as a lead quant analyst for a high-frequency trading desk. Analyze the specific Kill Chain confluence layer or execution signal provided. Explain the mathematical significance (GEX, VIX Term Structure, Net Delta), the current logic state (Pass/Fail), and potential catalysts using Google Search grounding. Use bullet points for tactical directives.';

        const userQuery = `Analyze Execution Signal:
Title: ${item.title ?? item.action}
Value: ${item.value ?? item.price}
Metric: ${item.unit ?? item.result}
Logic: ${item.goal ?? item.layers}
Meaning: ${item.meaning ?? 'N/A'}
Slug: ${item.slug ?? 'n/a'}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            tools: [{ google_search: {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        });
        const json = await res.json();
        const candidate = json.candidates?.[0];
        if (candidate?.content?.parts?.[0]?.text) {
          setAnalysis(candidate.content.parts[0].text);
          const attrs = candidate.groundingMetadata?.groundingAttributions ?? [];
          setSources(
            attrs
              .map((a: any) => ({ uri: a.web?.uri, title: a.web?.title }))
              .filter((s: any) => s.uri && s.title)
          );
        } else {
          setAnalysis('ORACLE_UPLINK_FAILURE: No analysis returned.');
        }
      } catch {
        setAnalysis('ORACLE_UPLINK_FAILURE: Data stream corrupted.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [item]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-[480px] bg-[#0c0c0e] border-l border-white/10 z-[300] shadow-[-20px_0_60px_rgba(0,0,0,0.6)] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Crosshair className="w-5 h-5 text-emerald-500" />
          <div>
            <span className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              Execution Oracle
            </span>
            <span className="block text-sm font-black text-white uppercase tracking-tighter">
              ZETA_STRATEGY_NODE
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
              <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-[10px] font-black font-mono text-emerald-400 uppercase tracking-[0.6em] animate-pulse">
              Running Confluence Scan
            </span>
          </div>
        ) : (
          <>
            {/* Signal card */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Strategy Logic</span>
              </div>
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">
                      Signal Node
                    </span>
                    <span className="block text-sm font-black text-white">{item.title ?? item.action}</span>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      item.status === 'pass'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {item.status ?? 'Active'}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-white font-mono tracking-tighter">
                    {item.value ?? item.price}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    SLUG: {item.slug ?? 'n/a'}
                  </span>
                </div>
              </div>
            </section>

            {/* Oracle text */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquareCode className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Oracle Analysis</span>
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap font-sans bg-zinc-950/30 p-5 rounded-xl border border-white/[0.02]">
                {analysis}
              </div>
            </section>

            {/* Sources */}
            {sources.length > 0 && (
              <section className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <FileSearch className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Market Context</span>
                </div>
                <div className="space-y-2">
                  {sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-white/[0.03] hover:border-cyan-500/30 transition-all group"
                    >
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-bold truncate max-w-[300px]">
                        {s.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-cyan-500" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
