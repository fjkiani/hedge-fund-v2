import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import type { UpcomingEvent, AiBriefingItem } from './types';
import { economicApi } from '../../lib/api';

interface Props {
  onDrillDown: (item: AiBriefingItem) => void;
}

export const CpiBanner: React.FC<Props> = ({ onDrillDown }) => {
  const [catalyst, setCatalyst] = useState<UpcomingEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (economicApi.upcomingCritical() as Promise<{ upcoming: UpcomingEvent[] }>)
      .then((res) => {
        const events = res.upcoming ?? [];
        const cpi = events.find((e) => /cpi|consumer price/i.test(e.event ?? ''));
        setCatalyst(cpi ?? events[0] ?? null);
      })
      .catch(() => setCatalyst(null))
      .finally(() => setLoading(false));
  }, []);

  const eventName = catalyst?.event ?? 'US CONSUMER PRICE INDEX (CPI)';
  // Use real date + time directly from the API — avoids fmtDate misparse of "Tuesday March 24 2026"
  const eventDate = loading
    ? 'SCANNING...'
    : catalyst
    ? `${catalyst.date ?? ''} · ${catalyst.time ?? '—'}`
    : 'DATE TBD';

  return (
    <div
      className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6 flex justify-between items-center relative overflow-hidden cursor-pointer group"
      onClick={() =>
        onDrillDown({
          title: `NEXT TARGET: ${eventName}`,
          value: eventDate,
          unit: 'Market Catalyst',
          status: 'fail',
          slug: 'catalyst-cpi-banner',
          meaning: 'High-volatility macro catalyst. Risk-off protocol active until release.',
        })
      }
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-[0_0_15px_#f43f5e]" />

      <div className="flex items-center gap-6">
        <div className="p-2 bg-rose-500/10 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            NEXT PRIMARY TARGET: {eventName}
          </h3>
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">
            High Volatility Catalyst · Risk-off protocol active
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-l border-white/5 pl-8">
        <Clock className="w-5 h-5 text-zinc-700" />
        <span
          className={`text-xl font-black font-mono tracking-tighter ${
            loading ? 'text-zinc-600 animate-pulse' : 'text-white'
          }`}
        >
          {eventDate}
        </span>
      </div>
    </div>
  );
};
