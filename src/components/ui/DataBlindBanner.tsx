/**
 * DataBlindBanner — surfaces broken institutional feeds so empty UI ≠ healthy.
 * Polls via existing api.ts clients (no ad-hoc URL theater). Never invents signals.
 */
import { useEffect, useState } from 'react';
import {
  api,
  axlfiApi,
  darkpoolApi,
  gammaApi,
  killchainApi,
  signalsApi,
} from '../../lib/api';

export type BlindFeed = {
  id: string;
  label: string;
  severity: 'critical' | 'warning';
  detail: string;
};

type Probe = {
  id: string;
  label: string;
  severity: 'critical' | 'warning';
  run: () => Promise<string | null>; // null = healthy
};

function errDetail(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/timed out/i.test(msg)) return 'timeout';
  if (/API Error:/i.test(msg)) return msg.replace(/^API Error:\s*/i, 'HTTP ');
  return msg || 'unreachable';
}

const probes: Probe[] = [
  {
    id: 'master',
    label: 'Master signals',
    severity: 'critical',
    run: async () => {
      const body: any = await signalsApi.getMaster();
      const n = body?.master_count ?? body?.count ?? (body?.signals?.length ?? 0);
      if (n === 0) return '0 master signals during poll';
      return null;
    },
  },
  {
    id: 'gamma',
    label: 'Gamma / walls',
    severity: 'critical',
    run: async () => {
      // Prefer existing gammaApi; walls-backed when CBOE is blind
      const body: any = await gammaApi.get('SPY');
      if (!body?.current_price && !body?.spot_price) {
        return 'no spot (CBOE + walls blind)';
      }
      return null;
    },
  },
  {
    id: 'darkpool',
    label: 'Dark pool SPY',
    severity: 'critical',
    run: async () => {
      const body: any = await darkpoolApi.getSummary('SPY');
      const pct = body?.summary?.short_volume_pct ?? body?.summary?.dp_percent;
      if (pct === undefined || pct === null) return 'summary missing short_volume_pct';
      return null;
    },
  },
  {
    id: 'walls',
    label: 'AXLFI walls',
    severity: 'critical',
    run: async () => {
      const body: any = await axlfiApi.wallsToday('SPY');
      const callWall = body?.call_wall ?? body?.callWall;
      const putWall = body?.put_wall ?? body?.putWall;
      if (!callWall && !putWall) return 'walls empty (call/put missing)';
      return null;
    },
  },
  {
    id: 'gate',
    label: 'Signal gate',
    severity: 'warning',
    run: async () => {
      const body: any = await api.get('/gate/health?n=20');
      if ((body?.allowed_count ?? 0) === 0 && (body?.blocked_count ?? 0) > 0) {
        return `blocked ${body.blocked_count} / allowed 0`;
      }
      return null;
    },
  },
  {
    id: 'killchain',
    label: 'Kill chain',
    severity: 'warning',
    run: async () => {
      const body: any = await killchainApi.monitor();
      const kc = body?.kill_chain ?? body;
      const gex = kc?.layer_2?.value ?? kc?.layers?.gex_total;
      // Walls fallback can legitimately report total_gex=0 — only flag if L2 missing entirely
      if (kc?.layer_2 == null && gex == null) return 'L2 missing';
      return null;
    },
  },
];

async function runProbes(): Promise<BlindFeed[]> {
  const results = await Promise.all(
    probes.map(async (p) => {
      try {
        const detail = await p.run();
        if (!detail) return null;
        return { id: p.id, label: p.label, severity: p.severity, detail } satisfies BlindFeed;
      } catch (e: unknown) {
        return {
          id: p.id,
          label: p.label,
          severity: p.severity,
          detail: errDetail(e),
        } satisfies BlindFeed;
      }
    }),
  );
  return results.filter(Boolean) as BlindFeed[];
}

export function DataBlindBanner({ refreshMs = 120_000 }: { refreshMs?: number }) {
  const [feeds, setFeeds] = useState<BlindFeed[]>([]);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const next = await runProbes();
      if (!cancelled) {
        setFeeds(next);
        setCheckedAt(new Date());
      }
    };
    tick();
    const id = setInterval(tick, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshMs]);

  if (feeds.length === 0) return null;

  const critical = feeds.filter((f) => f.severity === 'critical').length;
  const warnings = feeds.length - critical;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        margin: '0 0 1rem',
        padding: '0.75rem 1rem',
        border: '1px solid rgba(248, 113, 113, 0.35)',
        background: 'rgba(127, 29, 29, 0.25)',
        borderRadius: '0.5rem',
        color: '#fecaca',
        fontSize: '0.8125rem',
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.02em' }}>
        DATA BLIND — {feeds.length} feed{feeds.length === 1 ? '' : 's'} degraded
        {critical ? ` (${critical} critical${warnings ? `, ${warnings} warning` : ''})` : ''}
        {checkedAt ? ` · checked ${checkedAt.toLocaleTimeString()}` : ''}
      </div>
      <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {feeds.map((f) => (
          <li key={f.id}>
            <strong>{f.label}</strong>: {f.detail}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '0.4rem', opacity: 0.85 }}>
        Empty panels are not “no edge” — sensors are offline. Do not trade master confluence until critical feeds clear.
      </div>
    </div>
  );
}
