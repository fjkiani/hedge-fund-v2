import { useEffect, useState } from 'react';
import { Bot, ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ZOStrategy {
  name: string;
  trigger: string;
  target: string;
}

interface ZOPayload {
  think: string;
  audit: string;
  strategy: ZOStrategy;
  agent_instructions: string;
  risk_level: "RED" | "YELLOW" | "UNKNOWN";
  confidence: number;
}

interface KillChainOraclePanelProps {
  // We can pass the snapshot or raw json in
  snapshot: any;
  loading?: boolean;
}

const KC_API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
const KC_ANALYZE_URL = `${KC_API_BASE}/oracle/analyze`;

export function KillChainOraclePanel({ snapshot, loading: parentLoading }: KillChainOraclePanelProps) {
  const [data, setData] = useState<ZOPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thinkOpen, setThinkOpen] = useState(false);

  useEffect(() => {
    if (parentLoading || !snapshot) return;

    setLoading(true);
    let isMounted = true;

    async function fetchOracle() {
      try {
        const body = {
          title: "Kill Chain Macro Setup",
          action: "Analyze Confluence",
          kill_chain_snapshot: snapshot
        };
        const res = await fetch(KC_ANALYZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`Oracle returned ${res.status}`);
        }

        const json = await res.json();
        
        if (json.analysis) {
          try {
            // The python backend returns the json string inside json.analysis
            const parsed = JSON.parse(json.analysis) as ZOPayload;
            if (isMounted) {
              setData(parsed);
              setError(null);
            }
          } catch (e) {
            console.error("Failed to parse Oracle ZO JSON", e, json.analysis);
            if (isMounted) setError("Failed to parse Zeta JSON streams.");
          }
        } else {
          throw new Error("No analysis returned");
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Unknown Oracle error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOracle();

    return () => { isMounted = false; };
  }, [snapshot, parentLoading]);

  // If we don't have snapshot yet
  if (!snapshot && parentLoading) {
    return (
      <div className="flex flex-col h-full bg-[#111113] rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
         <PanelHeader loading={true} />
         <div className="flex-1 flex items-center justify-center text-zinc-600 text-[10px] uppercase font-black tracking-[0.2em]">
            Waiting for Signal Registry...
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#111113] rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
      <PanelHeader loading={loading} risk={data?.risk_level} />
      
      <div className="p-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {loading && !data ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-500">
            <span className="text-[10px] uppercase tracking-widest font-black animate-pulse">Establishing Zeta Uplink...</span>
          </div>
        ) : error && !data ? (
          <div className="h-full flex flex-col justify-center text-center gap-2 text-rose-500/80">
            <span className="text-[10px] uppercase font-black tracking-widest">Oracle Offline</span>
            <span className="text-xs">{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* THE THINK BLOCK (Accordion) */}
            {data.think && (
              <div className="border border-white/5 rounded-lg bg-black/40 overflow-hidden">
                <button 
                  onClick={() => setThinkOpen(!thinkOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Thinking Process</span>
                  </div>
                  {thinkOpen ? <ChevronDown className="w-4 h-4 text-zinc-600" /> : <ChevronRight className="w-4 h-4 text-zinc-600" />}
                </button>
                <AnimatePresence initial={false}>
                  {thinkOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 text-[12px] text-zinc-400 font-mono italic whitespace-pre-wrap leading-relaxed">
                        {data.think}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ALPHA AUDIT */}
            {data.audit && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  The Alpha Audit
                </h3>
                <div className="text-[13px] text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {formatMarkdownBold(data.audit)}
                </div>
              </div>
            )}

            {/* TRADING STRATEGY */}
            {data.strategy && (
              <div className="space-y-3 p-4 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                  Trading Strategy: {data.strategy.name}
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-3">
                   <div>
                     <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-1">Trigger</span>
                     <span className="text-xs text-rose-300 font-mono">{data.strategy.trigger}</span>
                   </div>
                   <div>
                     <span className="block text-[9px] text-zinc-500 uppercase tracking-widest font-black mb-1">Target</span>
                     <span className="text-xs text-rose-300 font-mono">{data.strategy.target}</span>
                   </div>
                </div>
              </div>
            )}

            {/* AGENT INSTRUCTIONS */}
            {data.agent_instructions && (
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Zeta Agent Instructions
                </h3>
                <div className="bg-[#0a0a0c] border border-white/10 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[11px] font-mono leading-relaxed text-blue-200/70">
                    <code>
                      {data.agent_instructions.replace(/^```(python|javascript|js)?\n/i, '').replace(/```$/i, '')}
                    </code>
                  </pre>
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}

function PanelHeader({ loading, risk }: { loading: boolean, risk?: string }) {
  const riskColor = risk === 'RED' ? 'text-rose-500' : risk === 'YELLOW' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
      <div className="flex items-center gap-3">
        <Bot className={`w-4 h-4 ${riskColor}`} />
        <span className="text-xs font-black text-white uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          NYX ORACLE · KILL CHAIN
        </span>
        {!loading && risk && (
           <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded bg-white/5 ${riskColor} tracking-widest ml-2 border border-white/5`}>
             {risk} RISK
           </span>
        )}
      </div>
      {loading && (
        <div className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      )}
    </div>
  );
}

function formatMarkdownBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
