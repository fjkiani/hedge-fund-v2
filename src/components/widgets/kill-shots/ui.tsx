// Shared UI primitives for Kill Shots Pillar components.
// Reusable across all 4 cards.
// Anti-slop rule: NO hardcoded/synthetic data in this file.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Layers, Target, ChevronDown, ChevronUp, X, Database } from 'lucide-react';

// ─── DataPoint Tooltip ────────────────────────────────────────────────────────
// Click-to-explain system. Every auditable data point gets one of these.
// content is static domain knowledge (what the metric IS, not LLM output).

export interface DataPointTooltipContent {
  what: string;    // Plain-english definition of this metric
  why: string;     // Why it matters in context of the live value
  source: string;  // Data source (e.g. "CBOE", "CFTC via Barchart", "Stockgrid")
}

interface DataPointProps {
  label: string;
  value: string;
  color?: string;
  tooltip: DataPointTooltipContent;
}

export const DataPoint: React.FC<DataPointProps> = ({ label, value, color, tooltip }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex justify-between items-end py-1 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-zinc-700 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            aria-label={`Explain ${label}`}
          >
            <Info className="w-2.5 h-2.5" />
          </button>
        </div>
        <span
          className="text-sm font-black font-mono cursor-pointer hover:opacity-80 transition-opacity"
          style={{ color: color || '#fff' }}
          onClick={() => setOpen((v) => !v)}
        >
          {value}
        </span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="overflow-hidden"
          >
            <div className="my-2 bg-zinc-950 border border-cyan-500/20 rounded-lg p-3 relative">
              {/* Corner accent */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/40 rounded-tl" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/40 rounded-br" />

              <button
                onClick={() => setOpen(false)}
                className="absolute top-2 right-2 text-zinc-700 hover:text-zinc-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>

              {/* What */}
              <div className="mb-2">
                <span className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em] block mb-0.5">
                  WHAT IS THIS
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">{tooltip.what}</p>
              </div>

              {/* Why */}
              <div className="mb-2">
                <span className="text-[8px] font-black text-orange-400 uppercase tracking-[0.3em] block mb-0.5">
                  WHY IT MATTERS NOW
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{tooltip.why}</p>
              </div>

              {/* Source */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                <Database className="w-2.5 h-2.5 text-zinc-600" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                  SRC: {tooltip.source}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── KV (simple key-value, no tooltip) ───────────────────────────────────────
// Use DataPoint instead if the field needs auditability.

export const KV = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div className="flex justify-between items-end py-1 border-b border-white/5 last:border-0">
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{label}</span>
    <span className="text-sm font-black font-mono" style={{ color: color || '#fff' }}>{value}</span>
  </div>
);

// ─── IntelligenceBriefing (LLM output, collapsible, anchored) ─────────────────
// anchor: human-readable string showing what live values this LLM output was generated from.
// This proves it's not generic copy — it was seeded by actual data.

interface BriefingProps {
  content?: string;
  anchor?: string;  // e.g. "GEX=$-28.3B, regime=STRONG_NEGATIVE"
}

export const IntelligenceBriefing: React.FC<BriefingProps> = ({ content, anchor }) => {
  const [expanded, setExpanded] = useState(false);

  if (!content) return (
    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', padding: '8px 0' }}>
      Intelligence briefing unavailable — analysis engine rate limited
    </div>
  );

  return (
    <div className="bg-zinc-950/60 rounded-lg border border-cyan-500/15 mt-4 overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-cyan-500/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-cyan-500" />
          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
            LLM Signal Readout
          </span>
        </div>
        <div className="flex items-center gap-2">
          {expanded
            ? <ChevronUp className="w-3 h-3 text-zinc-600" />
            : <ChevronDown className="w-3 h-3 text-zinc-600" />
          }
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Anchor line — proof of work */}
            {anchor && (
              <div className="px-3 py-1.5 border-t border-white/5 bg-zinc-900/50">
                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
                  ⌬ Anchored to live data: {anchor}
                </span>
              </div>
            )}
            {/* LLM text */}
            <p className="px-3 py-2.5 text-[11px] text-zinc-400 leading-relaxed font-medium italic border-t border-white/5">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── PillarFooter ─────────────────────────────────────────────────────────────
// Removed SESSION_SYNC_ACTIVE — had no backend meaning.

export const PillarFooter = ({ src, slug }: { src: string; slug?: string }) => (
  <div className="px-6 py-3 bg-zinc-950 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1.5">
        <Layers className="w-3 h-3" /> SRC: {src}
      </span>
      {slug && (
        <>
          <span className="h-3 w-px bg-zinc-900" />
          <span>SLUG: {slug}</span>
        </>
      )}
    </div>
    {/* Show slug as audit-trailing ID, not decorative text */}
    {!slug && (
      <span className="text-zinc-800">SLUG_PENDING</span>
    )}
  </div>
);

// ─── PillarShell ──────────────────────────────────────────────────────────────

export const PillarShell = ({
  children,
  isArmed,
  label,
  title,
  value,
  status,
}: {
  children: React.ReactNode;
  isArmed: boolean;
  label: string;
  title: string;
  value: string;
  status: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative group flex-1 min-w-[340px]"
  >
    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-sm" />
    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30 rounded-br-sm" />
    <div className={`relative bg-[#09090b] border ${isArmed ? 'border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.08)]' : 'border-white/10'} rounded-xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] z-10 opacity-10" />
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono flex items-center gap-2">
              <Target className="w-3 h-3" /> {label}
            </span>
            <h2 className="text-3xl font-black text-white tracking-tighter">
              {title} <span className="text-cyan-400 font-light ml-1">{value}</span>
            </h2>
          </div>
          <div className={`px-3 py-1 rounded border font-black text-[10px] tracking-widest ${isArmed ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
            {status}
          </div>
        </div>
        {children}
      </div>
    </div>
  </motion.div>
);
