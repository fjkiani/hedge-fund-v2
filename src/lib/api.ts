/**
 * API Client for Alpha Terminal Backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/v1';

export const api = {
  baseURL: API_URL,
  wsURL: WS_URL,

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
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
};

// Agents (Savage LLM)
export const agentsApi = {
  analyze: (agentName: string, data?: any) =>
    api.post(`/agents/${agentName}/analyze`, data || {}),
  getNarrative: () => api.get('/agents/narrative/current'),
  askNarrative: (question: string) =>
    api.post('/agents/narrative/ask', { question }),
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

// Chart / Trap Matrix
export const chartApi = {
  getMatrix: (symbol: string) =>
    api.get(`/charts/${symbol}/matrix`),
  getOHLC: (symbol: string, period: string = '3mo', interval: string = '1d') =>
    api.get(`/charts/${symbol}/ohlc?period=${period}&interval=${interval}`),
};

// System Health
export const healthApi = {
  getCheckers: () => api.get('/health/checkers'),
  getChecker: (name: string) => api.get(`/health/checkers/${name}`),
  getSummary: () => api.get('/health/summary'),
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
  // 🐺 Triple Confluence Monitor (Mars Rules)
  monitor: () => api.get('/kill-chain'),
  paperTrades: () => api.get('/paper-trades'),
};

// Economic Intelligence
export const economicApi = {
  fedwatch: () => api.get('/economic/fedwatch'),
  calendar: () => api.get('/economic/calendar'),
  upcomingCritical: () => api.get('/economic/upcoming-critical'),
  exploitBrief: (event: string = 'CPI') => api.get(`/economic/exploit-brief?event=${event}`),
  releases: () => api.get('/economic/releases'),
  fedwatchNarrative: () => api.get('/economic/fedwatch/narrative'),
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
