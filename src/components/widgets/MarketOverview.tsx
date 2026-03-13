/**
 * MarketOverview — Full-width hero widget
 *
 * Replaces the hardcoded placeholder with ChartContainer.
 * This is the top-level entry point in WidgetGrid.
 */

import { ChartContainer } from '../charts/ChartContainer';

interface MarketOverviewProps {
  symbol?: string;
}

export function MarketOverview({ symbol: _symbol }: MarketOverviewProps) {
  return <ChartContainer />;
}
