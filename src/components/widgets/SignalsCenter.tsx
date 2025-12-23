import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function SignalsCenter() {
  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">Active Signals</h2>
        <Badge variant="neutral">12 Active</Badge>
      </div>
      
      <div className="space-y-3">
        <div className="p-4 bg-bg-tertiary rounded-lg border border-accent-green/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">SPY</span>
              <Badge variant="bullish">SQUEEZE</Badge>
              <Badge variant="neutral">87%</Badge>
            </div>
          </div>
          <div className="text-sm text-text-secondary">
            Entry: $665.20 | Stop: $664.50 | Target: $666.60
          </div>
        </div>
        
        <div className="p-4 bg-bg-tertiary rounded-lg border border-accent-blue/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-primary">QQQ</span>
              <Badge variant="neutral">GAMMA</Badge>
              <Badge variant="neutral">72%</Badge>
            </div>
          </div>
          <div className="text-sm text-text-secondary">
            Entry: $520.10 | Stop: $519.00 | Target: $522.00
          </div>
        </div>
      </div>
      
      <div className="card-footer">
        <span className="text-text-muted">3 Master Signals</span>
        <button className="text-accent-blue hover:text-accent-blue/80">View All →</button>
      </div>
    </Card>
  );
}


