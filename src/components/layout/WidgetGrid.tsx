import { MarketOverview } from '../widgets/MarketOverview';
import { SignalsCenter } from '../widgets/SignalsCenter';
import { NarrativeBrain } from '../widgets/NarrativeBrain';

export function WidgetGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Market Overview - Full Width */}
      <div className="col-span-12">
        <MarketOverview symbol="SPY" />
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


