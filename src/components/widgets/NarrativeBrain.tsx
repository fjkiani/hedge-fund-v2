import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Brain } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { agentsApi } from '../../lib/api';
import { useEffect, useState } from 'react';

export function NarrativeBrain() {
  const [narrative, setNarrative] = useState<string>('Loading narrative...');
  const [confidence, setConfidence] = useState<number>(0);
  const { connected, data } = useWebSocket({ channel: 'narrative' });
  
  useEffect(() => {
    // Fetch initial narrative
    agentsApi.getNarrative()
      .then((response: any) => {
        setNarrative(response.narrative || 'No narrative available');
        setConfidence(response.confidence || 0);
      })
      .catch((err) => {
        console.error('Error fetching narrative:', err);
        setNarrative('Error loading narrative');
      });
  }, []);
  
  useEffect(() => {
    if (data && data.type === 'narrative') {
      setNarrative(data.narrative?.narrative || narrative);
      setConfidence(data.narrative?.confidence || confidence);
    }
  }, [data]);
  
  return (
    <Card>
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-purple" />
          <h2 className="card-title">Narrative Brain</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{confidence.toFixed(0)}%</Badge>
          {connected ? (
            <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-accent-red rounded-full" />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="prose prose-invert max-w-none">
          <p className="text-text-primary leading-relaxed">
            {narrative}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-purple transition-all duration-300"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-sm text-text-muted font-mono">{confidence}%</span>
        </div>
      </div>
      
      <div className="card-footer">
        <span className="text-text-muted">AI Synthesis</span>
        <button className="text-accent-purple hover:text-accent-purple/80">Ask AI →</button>
      </div>
    </Card>
  );
}


