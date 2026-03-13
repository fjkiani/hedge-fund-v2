/**
 * Dark Pool Intelligence — Full Page View
 *
 * Combines:
 *   - DPEdgeDashboard  (win rate, signals, patterns, predictions)
 *   - DarkPoolFlow     (live levels, buy/sell pressure, prints)
 *   - DPPredictionBadge (bounce probability)
 */

import { DPEdgeDashboard } from '../components/widgets/DPEdgeDashboard';
import { DarkPoolFlow } from '../components/widgets/DarkPoolFlow';

export function DarkPool() {
  return (
    <main className="min-h-screen bg-bg-primary p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <span>🏦</span> Dark Pool Intelligence
          </h1>
          <p className="text-text-secondary mt-2">
            Institutional block trades, learned patterns, and divergence signals.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Edge Dashboard */}
          <div className="space-y-6">
            <DPEdgeDashboard />
          </div>

          {/* Right: Live Flow */}
          <div className="space-y-6">
            <DarkPoolFlow symbol="SPY" />
          </div>
        </div>
      </div>
    </main>
  );
}
