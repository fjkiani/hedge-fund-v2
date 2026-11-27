/**
 * DataBlindBanner — surfaces broken institutional feeds so empty UI ≠ healthy.
 * Polls critical endpoints; never invents signal content.
 */
import { useEffect, useState } from 'react';
import { API_URL, MONITOR_URL } from '../../lib/api';

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
  url: string;
  interpret: (status: number, body: any) => string | null; // null = healthy
};

const probes: Probe[] = [
  {
    id: 'master',
    label: 'Master signals',
    severity: 'critical',
    url: `${API_URL}/signals/master`,
    interpret: (status, body) => {
      if (status !== 200) return `HTTP ${status}`;
      const n = body?.master_count ?? body?.count ?? (body?.signals?.length ?? 0);
      if (n === 0) return '0 master signals during poll';
      return null;
    },
  },
  {
    id: 'gamma',
    label: 'GEX / options',
    severity: 'critical',
    url: `${API_URL}/gamma/SPY`,
    interpret: (status) => (status === 200 ? null : `HTTP ${status} — CBOE/GEX blind`),
  },
  {
    id: 'darkpool',
    label: 'Dark pool SPY',
    severity: 'critical',
    url: `${API_URL}/darkpool/SPY/summary`,
    interpret: (status) => (status === 200 ? null : `HTTP ${status} — Stockgrid/DP blind`),
  },
  {
    id: 'walls',
    label: 'Intraday walls',
    severity: 'critical',
    url: `${API_URL}/intraday/snapshot`,
    interpret: (status, body) => {
      if (status !== 200) return `HTTP ${status}`;
      const wallUnknown = body?.wall_status === 'unknown' || (body?.spy_call_wall === 0 && body?.spy_put_wall === 0);
      return wallUnknown ? 'wall_status unknown / walls at 0' : null;
    },
  },
  {
    id: 'gate',
    label: 'Signal gate',
    severity: 'warning',
    url: `${API_URL}/gate/health`,
    interpret: (status, body) => {
      if (status !== 200) return `HTTP ${status}`;
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
    url: `${MONITOR_URL}/kill-chain`,
    interpret: (status, body) => {
      if (status !== 200) return `HTTP ${status}`;
      const kc = body?.kill_chain ?? body;
      const gex = kc?.layer_2?.value ?? kc?.layers?.gex_total;
      if (gex === 0 || gex === 0.0) return 'L2 GEX = 0 (blind)';
      return null;
    },
  },
];

async function runProbes(): Promise<BlindFeed[]> {
  const results = await Promise.all(
    probes.map(async (p) => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20_000);
        const res = await fetch(p.url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        clearTimeout(timer);
        let body: any = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }
        const detail = p.interpret(res.status, body);
        if (!detail) return null;
        return { id: p.id, label: p.label, severity: p.severity, detail } satisfies BlindFeed;
      } catch (e: any) {
        return {
          id: p.id,
          label: p.label,
          severity: p.severity,
          detail: e?.name === 'AbortError' ? 'timeout' : (e?.message || 'unreachable'),
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
        DATA BLIND — {critical} critical feed{critical === 1 ? '' : 's'} degraded
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
