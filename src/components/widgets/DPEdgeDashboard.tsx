import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dpApi } from '../../lib/api';
import { DPPatternCard } from './DPPatternCard';

interface DPEdgeStats {
  win_rate: number;
  total_interactions: number;
  bounces: number;
  breaks: number;
  breakeven_rr: number;
  expected_pnl_per_trade: number;
  cumulative_pnl: number;
}

interface DPPrediction {
  symbol: string;
  bounce_probability: number | null;
  confidence: number;
  action: string;
  reasoning: string;
  recent_interactions: number;
  recent_bounces?: number;
  recent_breaks?: number;
}

/* ── StatCard with gradient blob (Data-Linker pattern) ── */
function StatCard({ title, value, subtitle, intent = 'neutral', delay = 0 }: {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  intent?: 'neutral' | 'success' | 'danger' | 'gold';
  delay?: number;
}) {
  const intentColors = {
    neutral: { text: 'text-text-primary', blob: '#a0a0b0' },
    success: { text: 'neon-text-green', blob: '#00ff88' },
    danger:  { text: 'neon-text-red',   blob: '#ff3366' },
    gold:    { text: 'neon-text-gold',  blob: '#ffd700' },
  };
  const { text, blob } = intentColors[intent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="glass-card p-5 relative overflow-hidden group hover:border-border-active transition-colors duration-300"
    >
      {/* Decorative gradient blob */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: blob, opacity: 0.08 }}
      />
      <div className="relative z-10">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">{title}</h3>
        <div className={`text-3xl font-display font-bold data-number ${text}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-2 text-xs text-text-muted font-mono">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

export function DPEdgeDashboard() {
  const [stats, setStats] = useState<DPEdgeStats | null>(null);
  const [patterns, setPatterns] = useState<any[] | null>(null);
  const [prediction, setPrediction] = useState<DPPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, patternsRes, predictionRes] = await Promise.allSettled([
        dpApi.getEdgeStats(),
        dpApi.getPatterns(),
        dpApi.getPrediction('SPY'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value as DPEdgeStats);
      if (patternsRes.status === 'fulfilled') setPatterns((patternsRes.value as any).patterns || []);
      if (predictionRes.status === 'fulfilled') setPrediction(predictionRes.value as DPPrediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DP edge data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-panel rounded-xl p-6"
      >
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">🔥 DP Edge Dashboard</h2>
        <div className="flex items-center justify-center gap-3 py-10 text-text-muted">
          <div className="w-8 h-8 border-4 border-bg-tertiary rounded-full relative">
            <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="font-mono text-sm animate-pulse">Loading DP edge data…</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">🔥 DP Edge Dashboard</h2>
        <div className="text-accent-red text-center py-8 text-sm">
          ⚠ {error}
          <button onClick={loadData} className="text-xs text-accent-blue underline ml-2">Retry</button>
        </div>
      </div>
    );
  }

  // Compute directional bias
  const getBias = () => {
    if (!prediction || prediction.bounce_probability === null) {
      return { label: 'NO DATA', sublabel: 'Insufficient interactions', color: 'text-text-muted', bg: 'bg-bg-tertiary/30', border: 'border-border-subtle' };
    }
    const bp = prediction.bounce_probability;
    if (bp >= 70) return {
      label: 'BULLISH ABSORPTION',
      sublabel: `${bp}% bounce rate · ${prediction.recent_interactions} recent interactions`,
      color: 'neon-text-green',
      bg: 'bg-accent-green/5',
      border: 'border-accent-green/20',
    };
    if (bp <= 40) return {
      label: 'BEARISH BREAKDOWN',
      sublabel: `${bp}% bounce rate — levels failing`,
      color: 'neon-text-red',
      bg: 'bg-accent-red/5',
      border: 'border-accent-red/20',
    };
    return {
      label: 'NEUTRAL — NO EDGE',
      sublabel: `${bp}% bounce rate · mixed signals`,
      color: 'text-accent-gold',
      bg: 'bg-accent-gold/5',
      border: 'border-accent-gold/20',
    };
  };

  const bias = getBias();

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle/50">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
            🔥 DP Edge Dashboard
          </h2>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            DP level reaction analysis · {stats?.total_interactions ?? 0} interactions tracked
          </p>
        </div>
        {stats && stats.total_interactions >= 100 && (
          <span className="badge badge-bullish text-xs font-bold">PROVEN EDGE</span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {stats && (
          <>
            {/* Hero Bounce Rate — big number with neon glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-2"
            >
              <div className="text-6xl font-bold neon-text-gold data-number mb-1">
                {stats.win_rate.toFixed(1)}%
              </div>
              <div className="text-text-secondary text-sm font-mono">DP Level Bounce Rate</div>
              <div className="text-text-muted text-xs mt-1">
                {stats.bounces} bounces / {stats.breaks} breaks
              </div>
              <div className="text-text-muted/50 text-[10px] mt-2 italic max-w-xs mx-auto">
                Backtested on {stats.total_interactions.toLocaleString()} historical DP level interactions. Past performance not indicative of future results.
              </div>
            </motion.div>

            {/* Stat Cards Grid — Data-Linker pattern */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                title="Level Interactions"
                value={stats.total_interactions.toLocaleString()}
                delay={0.1}
              />
              <StatCard
                title="Break-even R/R"
                value={stats.breakeven_rr.toFixed(3)}
                intent="success"
                delay={0.2}
              />
              <StatCard
                title="Avg Edge"
                value={`+${stats.expected_pnl_per_trade.toFixed(4)}%`}
                subtitle="Per interaction"
                intent="success"
                delay={0.3}
              />
            </div>

            {/* Outcome Distribution Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">
                Outcome Distribution
              </div>
              <div className="flex h-7 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-center text-xs font-bold"
                  style={{
                    width: `${(stats.bounces / stats.total_interactions) * 100}%`,
                    backgroundColor: '#00ff88',
                    color: '#0a0a0f',
                  }}
                >
                  {stats.bounces}
                </div>
                <div
                  className="flex items-center justify-center text-xs font-bold"
                  style={{
                    width: `${(stats.breaks / stats.total_interactions) * 100}%`,
                    backgroundColor: '#ff3366',
                    color: '#ffffff',
                  }}
                >
                  {stats.breaks}
                </div>
              </div>
              <div className="flex justify-between text-xs text-text-muted mt-1 font-mono">
                <span>Bounces (Level Held)</span>
                <span>Breaks (Level Failed)</span>
              </div>
            </motion.div>

            {/* Directional Bias Banner — Data-Linker regime banner pattern */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`flex items-center justify-between p-4 rounded-xl border ${bias.border} ${bias.bg}`}
            >
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Directional Bias
                </div>
                <div className={`text-xl font-display font-bold ${bias.color}`}>
                  {bias.label}
                </div>
                <div className="text-xs text-text-muted mt-1">{bias.sublabel}</div>
              </div>
              {prediction && prediction.bounce_probability !== null && (
                <div className="text-right shrink-0">
                  <div className="text-3xl font-bold data-number" style={{
                    color: prediction.bounce_probability >= 70 ? '#00ff88' :
                      prediction.bounce_probability >= 40 ? '#ffd700' : '#ff3366',
                    filter: `drop-shadow(0 0 8px ${
                      prediction.bounce_probability >= 70 ? 'rgba(0,255,136,0.4)' :
                      prediction.bounce_probability >= 40 ? 'rgba(255,215,0,0.4)' : 'rgba(255,51,102,0.4)'
                    })`,
                  }}>
                    {prediction.bounce_probability}%
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">bounce prob</div>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Learned Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <DPPatternCard patterns={patterns || []} loading={loading && !patterns} />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border-subtle/50 flex items-center justify-between text-xs">
        <span className="text-text-muted font-mono">
          Updated {stats ? new Date().toLocaleTimeString() : 'Never'}
        </span>
        <button
          onClick={loadData}
          className="text-accent-blue hover:text-accent-blue/80 text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
