import { MarketOverview } from '../widgets/MarketOverview';
import { SignalsCenter } from '../widgets/SignalsCenter';
import { NarrativeBrain } from '../widgets/NarrativeBrain';
import { DPEdgeDashboard } from '../widgets/DPEdgeDashboard';
import { SystemHealth } from '../widgets/SystemHealth';
import { MarketRegime } from '../widgets/MarketRegime';

export function WidgetGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Market Overview - Full Width */}
      <div className="col-span-12">
        <MarketOverview symbol="SPY" />
      </div>
      
      {/* Market Regime + System Health - Side by Side */}
      <div className="col-span-6">
        <MarketRegime />
      </div>
      <div className="col-span-6">
        <SystemHealth />
      </div>
      
      {/* DP Edge Dashboard - Full Width (CRITICAL - 89.8% WR!) */}
      <div className="col-span-12">
        <DPEdgeDashboard />
      </div>
      
      {/* Signals Center - Left Column */}
      <div className="col-span-6">
        <SignalsCenter />
      </div>
      
      {/* Narrative Brain - Right Column */}
      <div className="col-span-6">
        <NarrativeBrain />
      </div>
    </div>
  );
}


