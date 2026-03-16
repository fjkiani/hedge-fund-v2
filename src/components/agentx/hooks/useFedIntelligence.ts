/**
 * 🏦 useFedIntelligence — Hook for live FedWatch + Economic Calendar data
 *
 * VERIFIED AGAINST ACTUAL NETWORK RESPONSE on 2026-03-13 (NOT the Python dataclass):
 *
 * The API calls engine.get_probabilities() — this returns a RAW DICT, not FedWatchStatus.
 * Fields confirmed from browser network tab capture:
 *   - current_range: [3.5, 3.75]         ARRAY not string
 *   - next_meeting.days_away: 6           NOT days_until
 *   - next_meeting.p_hold: 88.0           Probabilities INSIDE next_meeting
 *   - engine_source: "futures"            NOT source
 *   - summary: "Market pricing 23bp..."
 */

import { useState, useEffect, useCallback } from 'react';
import { economicApi } from '../../../lib/api';

// ── FedWatch Types — verified against LIVE network response ──

export interface RatePathEntry {
    date: string;             // "2026-03-19"
    label: string;            // "Mar 18-19"
    month_code: string;       // "H26"
    implied_rate: number;
    post_meeting_rate: number;
    delta_bps: number;
    p_cut_25: number;
    p_hold: number;
    p_hike_25: number;
    cumulative_bps: number;
    days_away: number;
}

export interface FedWatchData {
    source: string;                     // "yfinance_futures"
    engine_source: string;              // "futures"
    current_rate: number;               // 3.6375
    current_range: [number, number];    // [3.5, 3.75] — ARRAY
    current_midpoint: number;           // 3.625
    timestamp: string;
    next_meeting: RatePathEntry;        // SAME shape as rate_path entry!
    rate_path: RatePathEntry[];
    total_cuts_bps: number;             // 23.1
    total_cuts_count: number;           // 0.9
    summary: string;
}

// ── Calendar Types — verified against LIVE network response ──

export interface EconEvent {
    date: string;               // "Thursday March 12 2026"
    time: string;               // "12:30 PM"
    event: string;              // "Building Permits PrelJAN"
    actual: string | null;      // "1.376M" — STRING
    previous: string | null;
    consensus: string | null;
    forecast: string | null;
    importance: string;         // "HIGH"
    has_actual: boolean;
    has_consensus: boolean;
    is_upcoming: boolean;
}

export interface UseFedIntelligenceResult {
    fedwatch: FedWatchData | null;
    calendar: EconEvent[];
    loading: boolean;
    error: string | null;
    lastRefresh: Date | null;
    refresh: () => void;
}

// ── API response wrappers ──

interface FedWatchApiResponse {
    data?: FedWatchData & { error?: string };
    error?: string;
    source?: string;
    timestamp?: string;
}

interface CalendarApiResponse {
    events?: EconEvent[];
    count?: number;
    filter?: string;
    timestamp?: string;
}

export function useFedIntelligence(): UseFedIntelligenceResult {
    const [fedwatch, setFedwatch] = useState<FedWatchData | null>(null);
    const [calendar, setCalendar] = useState<EconEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);

            const [fwRes, calRes] = await Promise.allSettled([
                economicApi.fedwatch() as Promise<FedWatchApiResponse>,
                economicApi.calendar() as Promise<CalendarApiResponse>,
            ]);

            // FedWatch: Guard against error-inside-data
            if (fwRes.status === 'fulfilled') {
                const fw = fwRes.value;
                if (fw?.data && !fw.data.error && fw.data.rate_path) {
                    setFedwatch(fw.data);
                }
            }

            // Calendar
            if (calRes.status === 'fulfilled' && calRes.value?.events) {
                setCalendar(calRes.value.events);
            }

            setError(null);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message || 'Fed intelligence fetch failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 300_000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { fedwatch, calendar, loading, error, lastRefresh, refresh };
}
