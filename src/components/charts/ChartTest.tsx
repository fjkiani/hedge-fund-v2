/**
 * Test Component for TradingView Charts with Dynamic Level Overlays
 * 
 * This demonstrates:
 * - Real-time price updates
 * - Automatic DP level overlays
 * - Gamma flip level
 * - VWAP line
 * - Dynamic level updates
 */

import { useState, useEffect } from 'react';
import { TradingViewChart } from './TradingViewChart';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface DPLevel {
  price: number;
  volume: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'BATTLEGROUND';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export function ChartTest() {
  const [currentPrice, setCurrentPrice] = useState(665.20);
  const [dpLevels, setDPLevels] = useState<DPLevel[]>([
    { price: 665.50, volume: 2100000, type: 'RESISTANCE', strength: 'STRONG' },
    { price: 664.00, volume: 1500000, type: 'SUPPORT', strength: 'MODERATE' },
    { price: 662.75, volume: 800000, type: 'SUPPORT', strength: 'WEAK' },
    { price: 667.00, volume: 1800000, type: 'RESISTANCE', strength: 'MODERATE' },
    { price: 665.20, volume: 2500000, type: 'BATTLEGROUND', strength: 'STRONG' },
  ]);
  const [gammaFlipLevel, setGammaFlipLevel] = useState(658.00);
  const [vwap] = useState(664.50);
  const [chartData, setChartData] = useState<any[]>([]);

  // Generate sample candlestick data
  useEffect(() => {
    const generateData = () => {
      const data = [];
      const basePrice = 665.20;
      const now = new Date();
      
      for (let i = 100; i >= 0; i--) {
        const time = new Date(now);
        time.setMinutes(time.getMinutes() - i);
        
        const open = basePrice + (Math.random() - 0.5) * 2;
        const close = open + (Math.random() - 0.5) * 1.5;
        const high = Math.max(open, close) + Math.random() * 0.5;
        const low = Math.min(open, close) - Math.random() * 0.5;
        const volume = Math.floor(Math.random() * 1000000) + 500000;
        
        data.push({
          time: time.toISOString().slice(0, 19),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: volume,
        });
      }
      
      setChartData(data);
    };

    generateData();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.5;
        return parseFloat((prev + change).toFixed(2));
      });
      
      // Add new candle every minute
      const now = new Date();
      const newCandle = {
        time: now.toISOString().slice(0, 19),
        open: currentPrice,
        high: currentPrice + Math.random() * 0.3,
        low: currentPrice - Math.random() * 0.3,
        close: currentPrice + (Math.random() - 0.5) * 0.2,
        volume: Math.floor(Math.random() * 1000000) + 500000,
      };
      
      setChartData(prev => [...prev.slice(1), newCandle]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Test: Add a new DP level
  const addDPLevel = () => {
    const newLevel: DPLevel = {
      price: currentPrice + (Math.random() - 0.5) * 2,
      volume: Math.floor(Math.random() * 2000000) + 500000,
      type: Math.random() > 0.5 ? 'SUPPORT' : 'RESISTANCE',
      strength: ['WEAK', 'MODERATE', 'STRONG'][Math.floor(Math.random() * 3)] as any,
    };
    setDPLevels(prev => [...prev, newLevel]);
  };

  // Test: Remove a DP level
  const removeDPLevel = () => {
    if (dpLevels.length > 0) {
      setDPLevels(prev => prev.slice(0, -1));
    }
  };

  // Test: Update gamma flip level
  const updateGammaFlip = () => {
    setGammaFlipLevel(prev => prev + (Math.random() - 0.5) * 1);
  };

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">TradingView Chart Test - Dynamic Levels</h2>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{dpLevels.length} DP Levels</Badge>
          <Badge variant="neutral">Gamma: ${gammaFlipLevel.toFixed(2)}</Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* Chart */}
        <div className="bg-bg-tertiary rounded-lg p-4 border border-border-subtle">
          <TradingViewChart
            symbol="SPY"
            data={chartData}
            dpLevels={dpLevels}
            gammaFlipLevel={gammaFlipLevel}
            vwap={vwap}
            currentPrice={currentPrice}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg border border-border-subtle">
          <div className="flex-1">
            <div className="text-sm text-text-muted mb-2">Current Price</div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              ${currentPrice.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={addDPLevel} variant="outline" size="sm">
              + Add DP Level
            </Button>
            <Button onClick={removeDPLevel} variant="outline" size="sm">
              - Remove Level
            </Button>
            <Button onClick={updateGammaFlip} variant="outline" size="sm">
              Update Gamma
            </Button>
          </div>
        </div>

        {/* DP Levels List */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-text-primary">Active DP Levels:</div>
          <div className="space-y-1">
            {dpLevels.map((level, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-bg-tertiary rounded border border-border-subtle"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        level.type === 'SUPPORT' ? '#00ff88' :
                        level.type === 'RESISTANCE' ? '#ff3366' : '#ffd700',
                    }}
                  />
                  <span className="font-mono text-text-primary">${level.price.toFixed(2)}</span>
                  <Badge
                    variant={
                      level.type === 'SUPPORT' ? 'bullish' :
                      level.type === 'RESISTANCE' ? 'bearish' : 'neutral'
                    }
                  >
                    {level.type}
                  </Badge>
                  <Badge variant="neutral">{level.strength}</Badge>
                </div>
                <span className="text-sm text-text-secondary">
                  {level.volume.toLocaleString()} vol
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

