import { useEffect, useState } from 'react';
import { dpApi } from '../../lib/api';

interface Prediction {
    bounce_probability: number;
    break_probability: number;
    confidence: string;
    action: string;
    patterns_used: number;
}

interface DPPredictionBadgeProps {
    symbol: string;
    compact?: boolean;
}

export function DPPredictionBadge({ symbol, compact = false }: DPPredictionBadgeProps) {
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!symbol) return;
        dpApi
            .getPrediction(symbol)
            .then((data: any) => setPrediction(data))
            .catch(() => setPrediction(null))
            .finally(() => setLoading(false));
    }, [symbol]);

    if (loading) {
        return <span className="text-[10px] text-text-muted animate-pulse">⏳</span>;
    }

    if (!prediction || prediction.patterns_used === 0) {
        return null;
    }

    const bouncePercent = Math.round(prediction.bounce_probability * 100);
    const isBullish = bouncePercent >= 60;
    const isStrong = bouncePercent >= 75;

    const confColor = prediction.confidence === 'HIGH'
        ? 'text-accent-green'
        : prediction.confidence === 'MEDIUM'
            ? 'text-accent-orange'
            : 'text-text-muted';

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded
          ${isStrong ? 'bg-accent-green/15 text-accent-green border border-accent-green/30' :
                        isBullish ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30' :
                            'bg-accent-red/15 text-accent-red border border-accent-red/30'}`}
                title={`${prediction.patterns_used} patterns, ${prediction.confidence} confidence`}
            >
                🧠 {bouncePercent}% {prediction.action}
            </span>
        );
    }

    return (
        <div className={`p-2 rounded-lg border ${isStrong ? 'border-accent-green/30 bg-accent-green/5' :
                isBullish ? 'border-accent-blue/30 bg-accent-blue/5' :
                    'border-accent-red/30 bg-accent-red/5'}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">🧠</span>
                    <span className="text-xs font-semibold text-text-primary">
                        Pattern Prediction
                    </span>
                </div>
                <span className={`text-sm font-bold ${isStrong ? 'text-accent-green' : isBullish ? 'text-accent-blue' : 'text-accent-red'}`}>
                    {bouncePercent}% BOUNCE
                </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-secondary">
                <span className={confColor}>{prediction.confidence} conf</span>
                <span>{prediction.patterns_used} patterns</span>
                <span className="font-semibold">{prediction.action}</span>
            </div>
        </div>
    );
}
