/**
 * usePollingData — Universal data-fetching hook with auto-refresh, loading, error.
 * 
 * Eliminates 20-30 lines of boilerplate per widget.
 * 
 * Usage:
 *   const { data, loading, error, refresh } = usePollingData(
 *     () => gammaApi.get('SPY'),
 *     { interval: 30000, deps: ['SPY'] }
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface PollingOptions {
    /** Refresh interval in ms. 0 = no auto-refresh. Default: 30000 */
    interval?: number;
    /** Dependency array — refetch when any dep changes */
    deps?: any[];
    /** Whether to auto-start polling. Default: true */
    enabled?: boolean;
}

interface PollingResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    lastUpdated: Date | null;
}

export function usePollingData<T>(
    fetcher: () => Promise<T>,
    options: PollingOptions = {}
): PollingResult<T> {
    const { interval = 30000, deps = [], enabled = true } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetcherRef.current();
            setData(result);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
            console.error('usePollingData error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        refresh();
        if (interval > 0) {
            const timer = setInterval(refresh, interval);
            return () => clearInterval(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, interval, refresh, ...deps]);

    return { data, loading, error, refresh, lastUpdated };
}
