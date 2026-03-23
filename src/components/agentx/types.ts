/**
 * 🧠 Agent X — Shared Types
 * Single source of truth for all brain report interfaces.
 * Verified against actual Python output shapes — no guessing.
 */

export interface PoliticianDetail {
    name: string;
    ticker: string;
    type: string;
    size: string;
    date: string;
    is_routine?: boolean;
    owner?: string;
}

export interface InsiderDetail {
    name: string;
    company: string;
    ticker: string;
    type: string;
    value: number;
    date: string;
}

export interface HiddenHands {
    politician_cluster: number;
    politician_buys: number;
    politician_sells: number;
    insider_net_usd: number;
    insider_buys_usd: number;
    insider_sells_usd: number;
    insider_count: number;
    hot_tickers: string[];
    politician_details: PoliticianDetail[];
    insider_details: InsiderDetail[];
}

export interface FedTone {
    official: string;
    title: string;
    tone: string;
    confidence: number;
    reasoning: string;
}

export interface TavilyContext {
    query: string;
    summary: string;
    sources: string[];
    relevance_score: number;
    all_summaries: { title: string; content: string; score: number }[];
}

/** Matches FinnhubClient.cross_reference_politician_trade() output */
export interface FinnhubSignal {
    ticker: string;
    politician_action: string;
    insider_mspr: number | null;
    insider_trend: string;
    news_count_7d: number;
    convergence: string;
    divergence_boost: number;
    reasoning: string[];
    catalysts?: string[];
}

/** Matches FinnhubClient.get_company_news() output */
export interface FinnhubNewsItem {
    headline: string;
    source: string;
    url: string;
    datetime: number;
    summary: string;
}

/** Matches brain._get_spouse_alerts() output — queries owner column */
export interface SpouseAlert {
    politician: string;
    ticker: string;
    type: string;
    size: string;
    date: string;
    owner: string;
    alert: string;
}

/** Matches FedRSSCalendarPoller.poll_calendar() output */
export interface CalendarEvent {
    title: string;
    date: string;
    speaker: string;
    location: string;
}

export interface BrainReport {
    status: string;
    scan_time_seconds: number;
    fed_tone_summary: FedTone[];
    fed_hawkish_count: number;
    fed_dovish_count: number;
    fed_overall_tone: string;
    hidden_hands: HiddenHands;
    tavily_context: TavilyContext | null;
    divergence_boost: number;
    reasons: string[];
    timestamp: string;
    /* New fields — Finnhub + spouse + calendar */
    finnhub_signals: FinnhubSignal[];
    finnhub_news: Record<string, FinnhubNewsItem[]>;
    spouse_alerts: SpouseAlert[];
    fed_calendar_events: CalendarEvent[];
    error?: string;
}
