import { Card } from '../ui/Card';

interface MarketOverviewProps {
  symbol: string;
}

export function MarketOverview({ symbol }: MarketOverviewProps) {
  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">Market Overview - {symbol}</h2>
        <div className="flex items-center gap-2">
          <span className="badge badge-neutral">UPTREND</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-mono font-bold text-text-primary">$665.20</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-accent-green">+$2.95</span>
              <span className="text-sm text-accent-green">+0.45%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-text-muted">High</div>
              <div className="font-mono text-text-primary">$666.10</div>
            </div>
            <div>
              <div className="text-text-muted">Low</div>
              <div className="font-mono text-text-primary">$662.50</div>
            </div>
            <div>
              <div className="text-text-muted">Volume</div>
              <div className="font-mono text-text-primary">45.2M</div>
            </div>
          </div>
        </div>
        
        <div className="h-64 bg-bg-tertiary rounded-lg flex items-center justify-center border border-border-subtle">
          <p className="text-text-muted">Chart will be rendered here</p>
        </div>
      </div>
      
      <div className="card-footer">
        <span className="text-text-muted">Updated 2s ago</span>
        <button className="text-accent-blue hover:text-accent-blue/80">View More →</button>
      </div>
    </Card>
  );
}


