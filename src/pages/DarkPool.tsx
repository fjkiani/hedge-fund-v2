/**
 * Dark Pool Intelligence — Full Data-Linker Dashboard Layout
 *
 * Multi-panel dashboard with ALL ported Data-Linker components:
 * - DPEdgeDashboard (edge stats + patterns + directional bias)
 * - DarkPoolFlow (levels, prints, positions)
 * - GexPanel (gamma exposure + call/put walls)
 * - VolRegimePanel (VIX gauge + exploit score)
 * - SpxMatrixPanel (trap matrix + zone bar)
 *
 * Each panel is wrapped in an error boundary so one crash doesn't nuke the page.
 */

import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { DPEdgeDashboard } from '../components/widgets/DPEdgeDashboard';
import { DarkPoolFlow } from '../components/widgets/DarkPoolFlow';
import { GexPanel } from '../components/widgets/GexPanel';
import { VolRegimePanel } from '../components/widgets/VolRegimePanel';
import { SpxMatrixPanel } from '../components/widgets/SpxMatrixPanel';
import { TrapCompressionSignal } from '../components/widgets/TrapCompressionSignal';

/* ── Error Boundary (isolates panel crashes) ── */
class PanelErrorBoundary extends Component<{ name: string; children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-text-muted font-mono">{this.props.name} failed to render</p>
          <p className="text-xs text-text-muted/60 font-mono max-w-sm text-center">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs text-accent-blue underline mt-1"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function DarkPool() {
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'SPY';

  return (
    <motion.div
      className="min-h-screen p-6 space-y-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Page header — Data-Linker gradient text */}
      <motion.div variants={fadeUp}>
        <h1
          className="text-3xl font-display font-bold"
          style={{
            background: 'linear-gradient(135deg, #e2e8f0 0%, #00d4ff 40%, #00ff88 70%, #ffd700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🏴 Dark Pool Intelligence
        </h1>
        <p className="text-text-muted font-mono text-sm mt-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          FINRA Off-Exchange Volume · GEX · Vol Regime · Trap Matrix
        </p>
      </motion.div>

      {/* ── PRIMARY SIGNAL: Trap Compression Zone ── */}
      <motion.div variants={fadeUp}>
        <PanelErrorBoundary name="Trap Compression Signal">
          <TrapCompressionSignal symbol={symbol} />
        </PanelErrorBoundary>
      </motion.div>

      {/* Row 1: DP Edge + Dark Pool Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp}>
          <PanelErrorBoundary name="DP Edge Dashboard">
            <DPEdgeDashboard />
          </PanelErrorBoundary>
        </motion.div>
        <motion.div variants={fadeUp}>
          <PanelErrorBoundary name="Dark Pool Flow">
            <DarkPoolFlow symbol={symbol} />
          </PanelErrorBoundary>
        </motion.div>
      </div>

      {/* Row 2: SPX Trap Matrix (full width — the trade) + GEX Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp}>
          <PanelErrorBoundary name="SPX Trap Matrix">
            <SpxMatrixPanel symbol="SPY" />
          </PanelErrorBoundary>
        </motion.div>
        <motion.div variants={fadeUp}>
          <PanelErrorBoundary name="GEX Panel">
            <GexPanel symbol={symbol} />
          </PanelErrorBoundary>
        </motion.div>
      </div>

      {/* Row 3: Vol Regime */}
      <motion.div variants={fadeUp}>
        <PanelErrorBoundary name="Vol Regime">
          <VolRegimePanel />
        </PanelErrorBoundary>
      </motion.div>
    </motion.div>
  );
}
