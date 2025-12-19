/**
 * TradingView Lightweight Charts Component
 * 
 * Supports:
 * - Real-time price updates
 * - Automatic DP level overlays (horizontal lines)
 * - Gamma flip level markers
 * - VWAP line
 * - Volume bars
 * - Custom markers for signals
 */

import { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

interface DPLevel {
  price: number;
  volume: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'BATTLEGROUND';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

interface TradingViewChartProps {
  symbol?: string;
  data?: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  dpLevels?: DPLevel[];
  gammaFlipLevel?: number;
  vwap?: number;
  currentPrice?: number;
  onLevelClick?: (level: DPLevel) => void;
}

export function TradingViewChart({
  data = [],
  dpLevels = [],
  gammaFlipLevel,
  vwap,
  currentPrice,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<Array<{ id: string; priceLine: any }>>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0f' },
        textColor: '#a0a0b0',
      },
      grid: {
        vertLines: { color: '#2a2a35' },
        horzLines: { color: '#2a2a35' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2a35',
      },
    });

    chartRef.current = chart;

    // Create candlestick series using addSeries with series definition
    const candlestick = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff88',
      downColor: '#ff3366',
      borderVisible: false,
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3366',
    }) as ISeriesApi<'Candlestick'>;
    candlestickSeriesRef.current = candlestick;

    // Create volume series
    const volume = chart.addSeries(HistogramSeries, {
      color: '#00d4ff',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    }) as ISeriesApi<'Histogram'>;
    volumeSeriesRef.current = volume;

    setIsReady(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !isReady) return;

    // Format data for TradingView (convert time string to timestamp)
    const formattedData = data.map((bar) => ({
      time: (new Date(bar.time).getTime() / 1000) as any, // Convert to Unix timestamp
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    const volumeData = data.map((bar) => ({
      time: (new Date(bar.time).getTime() / 1000) as any,
      value: bar.volume,
      color: bar.close >= bar.open ? '#00ff8840' : '#ff336640',
    }));

    candlestickSeriesRef.current.setData(formattedData);
    volumeSeriesRef.current.setData(volumeData);
  }, [data, isReady]);

  // Add DP level overlays
  useEffect(() => {
    if (!candlestickSeriesRef.current || !isReady) return;

    // Clear existing price lines
    priceLinesRef.current.forEach(({ priceLine }) => {
      candlestickSeriesRef.current!.removePriceLine(priceLine);
    });
    priceLinesRef.current = [];

    // Add DP levels as price lines
    dpLevels.forEach((level, idx) => {
      const color = 
        level.type === 'SUPPORT' ? '#00ff88' :
        level.type === 'RESISTANCE' ? '#ff3366' :
        '#ffd700'; // BATTLEGROUND = gold

      const lineWidth = 
        level.strength === 'STRONG' ? 3 :
        level.strength === 'MODERATE' ? 2 : 1;

      const lineStyle = 
        level.type === 'BATTLEGROUND' ? LineStyle.Dashed : LineStyle.Solid;

      const priceLine = candlestickSeriesRef.current!.createPriceLine({
        price: level.price,
        color: color,
        lineWidth: lineWidth,
        lineStyle: lineStyle,
        axisLabelVisible: true,
        title: `${level.type} ${level.volume.toLocaleString()}`,
        lineVisible: true,
        axisLabelColor: color,
        axisLabelTextColor: color,
      });

      priceLinesRef.current.push({ id: `dp-${idx}`, priceLine });
    });

    // Add gamma flip level
    if (gammaFlipLevel) {
      const priceLine = candlestickSeriesRef.current.createPriceLine({
        price: gammaFlipLevel,
        color: '#a855f7',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'Gamma Flip',
        lineVisible: true,
        axisLabelColor: '#a855f7',
        axisLabelTextColor: '#a855f7',
      });
      priceLinesRef.current.push({ id: 'gamma-flip', priceLine });
    }

    // Add VWAP line
    if (vwap) {
      const priceLine = candlestickSeriesRef.current.createPriceLine({
        price: vwap,
        color: '#00d4ff',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'VWAP',
        lineVisible: true,
        axisLabelColor: '#00d4ff',
        axisLabelTextColor: '#00d4ff',
      });
      priceLinesRef.current.push({ id: 'vwap', priceLine });
    }

    // Add current price line
    if (currentPrice) {
      const priceLine = candlestickSeriesRef.current.createPriceLine({
        price: currentPrice,
        color: '#ffffff',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'Current',
        lineVisible: true,
        axisLabelColor: '#ffffff',
        axisLabelTextColor: '#ffffff',
      });
      priceLinesRef.current.push({ id: 'current', priceLine });
    }
  }, [dpLevels, gammaFlipLevel, vwap, currentPrice, isReady]);

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full" style={{ height: '400px' }} />
    </div>
  );
}
