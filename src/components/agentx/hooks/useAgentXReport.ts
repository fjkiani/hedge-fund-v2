/**
 * 🧠 useAgentXReport — Custom hook for brain report data
 * Encapsulates fetch, auto-refresh, error handling.
 * Any component can consume the brain report independently.
 */

import { useState, useEffect, useCallback } from 'react';
import type { BrainReport } from '../types';
import { agentxApi } from '../../../lib/api';
const REFRESH_INTERVAL = 120_000; // 2 minutes

interface UseAgentXReportResult {
    report: BrainReport | null;
    loading: boolean;
    error: string | null;
    lastRefresh: Date | null;
    refresh: () => void;
}

export function useAgentXReport(): UseAgentXReportResult {
    const [report, setReport] = useState<BrainReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const data = await agentxApi.getBrainReport() as BrainReport;
            setReport(data);
            setError(null);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch brain report');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [refresh]);

    return { report, loading, error, lastRefresh, refresh };
}
