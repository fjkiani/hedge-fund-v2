/**
 * Signals Page — Signal Journal
 *
 * Composes from ui/* primitives: PageShell, PageHeader, TabNav, Section,
 * StatCard, StatusBadge, DataRow, EmptyState.
 *
 * Zero raw divs. Zero inline styles. All visual logic in ui-components.css.
 */
import { useState, useEffect } from 'react';
import { SignalsCenter } from '../components/widgets/SignalsCenter';
import { signalsApi } from '../lib/api';

/* ── UI Primitives ── */
import { PageShell } from '../components/ui/PageShell';
import { PageHeader } from '../components/ui/PageHeader';
import { TabNav } from '../components/ui/TabNav';
import { Section } from '../components/ui/Section';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataRow, DataList } from '../components/ui/DataRow';
import { EmptyState } from '../components/ui/EmptyState';

/* ───── Types ───── */
interface AlertHistoryItem {
  id: number;
  alert_type: string;
  symbol: string;
  title: string;
  source: string;
  timestamp: string;
}

interface ScorecardEntry {
  symbol: string;
  action: string;
  type: string;
  source: string;
  signal_price: number;
  current_price: number;
  pnl_pct: number;
  hit_target: boolean;
  hit_stop: boolean;
  status: 'WIN' | 'LOSS' | 'OPEN' | 'FLAT';
  timestamp: string;
}

type Tab = 'active' | 'history' | 'scorecard';

/* ───── Helpers ───── */
type Color = 'green' | 'red' | 'orange' | 'purple' | 'blue' | 'default';

function symbolColor(type: string): Color {
  if (type.includes('bullish') || type.includes('rally')) return 'green';
  if (type.includes('bearish') || type.includes('selloff')) return 'red';
  if (type.includes('trump') || type.includes('exploit')) return 'orange';
  if (type.includes('dp') || type.includes('dark')) return 'purple';
  if (type.includes('earnings') || type.includes('news') || type.includes('breaking')) return 'blue';
  return 'default';
}

function typeIcon(type: string): string {
  if (type.includes('bullish')) return '🟢';
  if (type.includes('bearish')) return '🔴';
  if (type.includes('trump')) return '🎯';
  if (type.includes('dp')) return '🏦';
  if (type.includes('kill_chain')) return '🐺';
  if (type.includes('narrative')) return '🧠';
  if (type.includes('earnings')) return '📅';
  if (type.includes('synthesis')) return '⚡';
  if (type.includes('news') || type.includes('breaking')) return '📰';
  if (type.includes('fed')) return '🏛️';
  if (type.includes('gamma')) return '📊';
  if (type.includes('startup')) return '🏥';
  return '📡';
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ts; }
}

/* ───── Tab config ───── */
const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: '📡 Active Signals' },
  { key: 'history', label: '📋 Alert History' },
  { key: 'scorecard', label: '📊 P&L Scorecard' },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function Signals() {
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [scorecardLoading, setScorecardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('active');

  useEffect(() => { loadHistory(); loadScorecard(); }, []);

  const loadHistory = async () => {
    try {
      const data = (await signalsApi.getHistory()) as { alerts: AlertHistoryItem[] };
      setHistory(data?.alerts || []);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const loadScorecard = async () => {
    try {
      const data = (await signalsApi.getScorecard()) as { entries: ScorecardEntry[] };
      setScorecard(data?.entries || []);
    } catch { /* silent */ }
    finally { setScorecardLoading(false); }
  };

  /* ── Derived stats ── */
  const wins = scorecard.filter(e => e.status === 'WIN').length;
  const losses = scorecard.filter(e => e.status === 'LOSS').length;
  const open = scorecard.filter(e => e.status === 'OPEN').length;
  const winRate = wins + losses > 0 ? `${(wins / (wins + losses) * 100).toFixed(0)}%` : 'N/A';
  const totalPnl = scorecard.reduce((sum, e) => sum + e.pnl_pct, 0);
  const pnlStr = `${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}%`;

  /* ── P&L strip (header action) ── */
  const pnlStrip = scorecard.length > 0 ? (
    <div className="ui-pnl-strip">
      <span className="ui-pnl-strip__win">{wins}W</span>
      <span className="ui-pnl-strip__loss">{losses}L</span>
      <span className="ui-pnl-strip__open">{open}O</span>
      <span className="ui-pnl-strip__divider">│</span>
      <span className="ui-pnl-strip__label">WR: {winRate}</span>
      <span className={totalPnl >= 0 ? 'ui-pnl-strip__total--up' : 'ui-pnl-strip__total--down'}>
        {pnlStr}
      </span>
    </div>
  ) : undefined;

  return (
    <PageShell>
      <PageHeader
        icon="🐺"
        title="Signal Journal"
        subtitle="Live signals · Alert history · P&L scorecard"
        actions={pnlStrip}
      />

      <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ═══ ACTIVE SIGNALS ═══ */}
      {activeTab === 'active' && <SignalsCenter />}

      {/* ═══ ALERT HISTORY ═══ */}
      {activeTab === 'history' && (
        <Section title="Alert History (Today)" count={history.length} countLabel="alerts">
          {historyLoading ? (
            <EmptyState loading message="Loading alerts…" />
          ) : history.length === 0 ? (
            <EmptyState icon="📭" message="No alerts captured today" />
          ) : (
            <DataList scrollable>
              {history.map(alert => (
                <DataRow
                  key={alert.id}
                  icon={typeIcon(alert.alert_type)}
                  primary={alert.symbol || 'SYSTEM'}
                  primaryColor={symbolColor(alert.alert_type)}
                  tag={alert.alert_type}
                  secondary={alert.title}
                  trailing={formatTime(alert.timestamp)}
                />
              ))}
            </DataList>
          )}
        </Section>
      )}

      {/* ═══ SCORECARD ═══ */}
      {activeTab === 'scorecard' && (
        <Section
          title="Daily P&L Scorecard"
          onRefresh={() => { setScorecardLoading(true); loadScorecard(); }}
        >
          {/* Stats grid */}
          {scorecard.length > 0 && (
            <StatGrid columns={5}>
              <StatCard value={scorecard.length} label="Signals" />
              <StatCard value={wins} label="Wins" variant="green" />
              <StatCard value={losses} label="Losses" variant="red" />
              <StatCard value={winRate} label="Win Rate" />
              <StatCard value={pnlStr} label="Total P&L" variant={totalPnl >= 0 ? 'green' : 'red'} />
            </StatGrid>
          )}

          {/* Score entries */}
          {scorecardLoading ? (
            <EmptyState loading message="Loading scorecard…" />
          ) : scorecard.length === 0 ? (
            <EmptyState icon="📊" message="No scored signals today" />
          ) : (
            <DataList>
              {scorecard.map((entry, i) => (
                <DataRow
                  key={i}
                  leftSlot={<StatusBadge status={entry.status} />}
                  primary={`${entry.action} ${entry.symbol}`}
                  tag={entry.type}
                  detail={`Entry: $${entry.signal_price.toFixed(2)} → Now: $${entry.current_price.toFixed(2)}`}
                  value={`${entry.pnl_pct >= 0 ? '+' : ''}${entry.pnl_pct.toFixed(2)}%`}
                  valueUp={entry.pnl_pct >= 0}
                  trailing={formatTime(entry.timestamp)}
                />
              ))}
            </DataList>
          )}
        </Section>
      )}
    </PageShell>
  );
}
