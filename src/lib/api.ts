/**
 * API Client for Alpha Terminal Backend
 *
 * Production (Vercel): defaults to same-origin `/api/v1` + vercel.json rewrites → Render.
 * Override with VITE_API_URL / VITE_MONITOR_URL / VITE_WS_URL when needed.
 */

const PROD_RENDER_HOST = 'lotto-machine-wr6t.onrender.com';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

export const MONITOR_URL =
  import.meta.env.VITE_MONITOR_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8000');

export const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.PROD
    ? `wss://${PROD_RENDER_HOST}/api/v1`
    : 'ws://localhost:8000/api/v1');

const DEFAULT_TIMEOUT_MS = 10_000; // 10s — fail fast, don't hang

async function fetchWithRenderWakeRetry(
  url: string,
  init?: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if ((res.status === 503 || res.status === 502) && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Failed to fetch');
}

function withTimeout(ms: number = DEFAULT_TIMEOUT_MS): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

export const api = {
  baseURL: API_URL,
  wsURL: WS_URL,

  async get<T>(endpoint: string, timeoutMs?: number): Promise<T> {
    const { signal, clear } = withTimeout(timeoutMs);
    try {
      const response = await fetchWithRenderWakeRetry(`${API_URL}${endpoint}`, { signal });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error(`Request timed out: ${endpoint}`);
      throw e;
    } finally {
      clear();
    }
  },

  async post<T>(endpoint: string, data: any, timeoutMs?: number): Promise<T> {
    const { signal, clear } = withTimeout(timeoutMs);
    try {
      const response = await fetchWithRenderWakeRetry(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal,
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error(`Request timed out: ${endpoint}`);
      throw e;
    } finally {
      clear();
    }
  },
};

// Market Data
export const marketApi = {
  getQuote: (symbol: string) => api.get(`/market/${symbol}/quote`),
  getCandles: (symbol: string, timeframe: string = '1m') =>
    api.get(`/market/${symbol}/candles?timeframe=${timeframe}`),
  getContext: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return api.get(`/market/context${params}`);
  },
};

// Signals
export const signalsApi = {
  getAll: () => api.get('/signals'),
  getMaster: () => api.get('/signals/master'),
  getById: (id: string) => api.get(`/signals/${id}`),
  getForSymbol: (symbol: string, masterOnly: boolean = false) =>
    api.get(`/signals?symbol=${symbol}&master_only=${masterOnly}`),
  getHistory: (limit: number = 100) => api.get(`/signals/history?limit=${limit}`),
  getScorecard: () => api.get('/signals/scorecard', 30_000),
  getMorningBrief: () => api.get('/signals/morning-brief', 30_000),
  getOutcomeScorecard: () => api.get('/signals/outcomes/scorecard'),
  checkOutcomes: () => api.post('/signals/outcomes/check', {}),
  takeTrade: (signalId: string) => api.post(`/signals/take-trade?signal_id=${signalId}`, {}),
};

// Agents (Savage LLM)
export const agentsApi = {
  analyze: (agentName: string, data?: any) =>
    api.post(`/agents/${agentName}/analyze`, data || {}),
  getNarrative: () => api.get('/agents/narrative/current', 15_000), // narrative is slow — 15s
  askNarrative: (question: string) =>
    api.post('/agents/narrative/ask', { question }, 15_000),
};

// DP Edge (89.8% WR Proven!)
export const dpApi = {
  getEdgeStats: () => api.get('/dp/edge-stats'),
  getRecentInteractions: (days: number = 1, symbol?: string) => {
    const params = new URLSearchParams({ days: days.toString() });
    if (symbol) params.append('symbol', symbol);
    return api.get(`/dp/interactions/recent?${params.toString()}`);
  },
  getDivergenceSignals: () => api.get('/signals/divergence'),
  getPatterns: () => api.get('/dp/patterns'),
  getPrediction: (symbol: string) => api.get(`/dp/prediction/${symbol}`),
  getTrends: (symbol: string, days: number = 30) => api.get(`/dp/trends/${symbol}?days=${days}`),
};

// Dark Pool Data
export const darkpoolApi = {
  getLevels: (symbol: string) => api.get(`/darkpool/${symbol}/levels`),
  getSummary: (symbol: string) => api.get(`/darkpool/${symbol}/summary`),
  getPrints: (symbol: string, limit: number = 10) =>
    api.get(`/darkpool/${symbol}/prints?limit=${limit}`),
  getNarrative: () => api.get('/darkpool/narrative'),
  getTopPositions: (limit: number = 10) =>
    api.get(`/darkpool/top-positions?limit=${limit}`),
};

// Chart / Trap Matrix — cold build on Render can take 15–30s (multi-source fetch)
const MATRIX_TIMEOUT_MS = 60_000;
const OHLC_TIMEOUT_MS = 30_000;

export const chartApi = {
  getMatrix: (symbol: string) =>
    api.get(`/charts/${symbol}/matrix`, MATRIX_TIMEOUT_MS),
  getOHLC: (symbol: string, period: string = '3mo', interval: string = '1d') =>
    api.get(`/charts/${symbol}/ohlc?period=${period}&interval=${interval}`, OHLC_TIMEOUT_MS),
};

// System Health
export const healthApi = {
  getCheckers: () => api.get('/health/checkers'),
  getChecker: (name: string) => api.get(`/health/checkers/${name}`),
  getSummary: () => api.get('/health/summary'),
  getHistory: (days: number = 7) => api.get(`/health/history?days=${days}`),
  getWinRates: () => api.get('/health/win-rates'),
};

// Narrative Memory (cross-session intelligence)
export const narrativeApi = {
  getMemory: () => api.get('/narrative/memory'),
  getPreviousSession: () => api.get('/narrative/previous-session'),
  getCurrent: () => api.get('/agents/narrative/current', 15_000),
  ask: (question: string) => api.post('/agents/narrative/ask', { question }, 15_000),
};

// WebSocket
export const createWebSocket = (channel: string): WebSocket => {
  const ws = new WebSocket(`${WS_URL}/ws/${channel}`);
  return ws;
};

// Agent X (Fed Officials Brain)
export const agentxApi = {
  getBrainReport: () => api.get('/agentx/report'),
  enrichTickers: (tickers: string[], politician?: string) => {
    const params = new URLSearchParams({ tickers: tickers.join(',') });
    if (politician) params.append('politician', politician);
    return api.get(`/agentx/enrich?${params.toString()}`);
  },
};

// Kill Chain Intelligence
export const killchainApi = {
  scan: () => api.get('/killchain/scan'),
  narrative: () => api.get('/killchain/narrative'),
  gex: (symbol: string) => api.get(`/killchain/gex/${symbol}`),
  // 🐺 Triple Confluence Monitor — hits ROOT endpoints (uses timeout)
  monitor: async () => {
    const { signal, clear } = withTimeout();
    try {
      const res = await fetchWithRenderWakeRetry(`${MONITOR_URL}/kill-chain`, { signal });
      if (!res.ok) throw new Error(`Kill chain: ${res.statusText}`);
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Kill chain request timed out');
      throw e;
    } finally { clear(); }
  },
  paperTrades: async () => {
    const { signal, clear } = withTimeout();
    try {
      const res = await fetchWithRenderWakeRetry(`${MONITOR_URL}/paper-trades`, { signal });
      if (!res.ok) throw new Error(`Paper trades: ${res.statusText}`);
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Paper trades request timed out');
      throw e;
    } finally { clear(); }
  },
};

// Economic Intelligence
export const economicApi = {
  fedwatch: () => api.get('/economic/fedwatch'),
  calendar: () => api.get('/economic/calendar'),
  upcomingCritical: () => api.get('/economic/upcoming-critical'),
  exploitBrief: (event: string = 'CPI') => api.get(`/economic/exploit-brief?event=${event}`),
  releases: () => api.get('/economic/releases'),
};

// Gamma Exposure
export const gammaApi = {
  get: (symbol: string) => api.get(`/gamma/${symbol}`),
};

// Pivot Points
export const pivotsApi = {
  get: (symbol: string) => api.get(`/pivots/${symbol}`),
};

// COT Positioning
export const cotApi = {
  positioning: () => api.get('/cot/positioning'),
};

// Technical Analysis
export const taApi = {
  consensus: (symbol: string) => api.get(`/ta/${symbol}/consensus`),
};

// Squeeze Scanner
export const squeezeApi = {
  scan: (minScore: number = 55, maxResults: number = 20) => {
    const params = new URLSearchParams({
      min_score: minScore.toString(),
      max_results: maxResults.toString(),
    });
    return api.get(`/squeeze/scan?${params.toString()}`);
  },
  active: () => api.get('/squeeze/active'),
};

// Options Flow
export const optionsApi = {
  flow: (symbol: string, limit: number = 10) =>
    api.get(`/options/${symbol}/flow?limit=${limit}`),
  unusual: (symbol: string) => api.get(`/options/${symbol}/unusual`),
};

// AXLFI Intelligence (Dark Pool + Option Walls + Signals + Clusters)
export const axlfiApi = {
  dashboard:     ()                    => api.get('/axlfi/dashboard', 15_000),
  signals:       ()                    => api.get('/axlfi/signals'),
  regime:        ()                    => api.get('/axlfi/regime'),
  movers:        ()                    => api.get('/axlfi/movers'),
  optionWalls:   (sym: string)         => api.get(`/axlfi/option-walls/${sym}`),
  wallsToday:    (sym: string)         => api.get(`/axlfi/option-walls/${sym}/today`),
  snapshot:      ()                    => api.get('/axlfi/snapshot'),
  clusters:      (u: string = 'sp500') => api.get(`/axlfi/clusters?universe=${u}`),
  info:          (sym: string)         => api.get(`/axlfi/info/${sym}`),
  detail:        (sym: string, w = 30) => api.get(`/axlfi/detail/${sym}?window=${w}`),
  earningsIntel: (tickers: string[])   => api.get(`/axlfi/earnings-intel?tickers=${tickers.join(',')}`),
};

// Morning Brief (zero-click pre-market intelligence)
export const briefApi = {
  get: async () => {
    const { signal, clear } = withTimeout(30_000);
    try {
      const res = await fetchWithRenderWakeRetry(`${MONITOR_URL}/morning-brief`, { signal });
      if (!res.ok) throw new Error(`Brief: ${res.statusText}`);
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Morning brief request timed out');
      throw e;
    } finally { clear(); }
  },
  generate: async () => {
    const { signal, clear } = withTimeout(120_000); // generation can be slow
    try {
      const res = await fetchWithRenderWakeRetry(`${MONITOR_URL}/morning-brief/generate`, { signal });
      if (!res.ok) throw new Error(`Brief generate: ${res.statusText}`);
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Brief generation timed out');
      throw e;
    } finally { clear(); }
  },
  signalIntel: async () => {
    const { signal, clear } = withTimeout(60_000);
    try {
      const res = await fetchWithRenderWakeRetry(`${MONITOR_URL}/signal-intel`, { signal });
      if (!res.ok) throw new Error(`Signal intel: ${res.statusText}`);
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') throw new Error('Signal intel request timed out');
      throw e;
    } finally { clear(); }
  },
};

export const intradayApi = {
  snapshot: () => api.get('/intraday/snapshot'),
};

