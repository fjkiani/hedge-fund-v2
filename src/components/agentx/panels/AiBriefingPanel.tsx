/**
 * AiBriefingPanel — Slide-in oracle overlay
 *
 * Shared between AgentX and Politicians pages.
 * Calls Gemini API with signal context for tactical analysis.
 * API key from VITE_GEMINI_API_KEY env var.
 */

import { useState, useEffect } from 'react';
import type { UnifiedSignal } from './SignalFeedGrid';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_KEY}`;

interface Source {
  uri: string;
  title: string;
}

export interface BriefableItem {
  /** For UnifiedSignal */
  action?: string;
  tickers?: string[];
  source?: string;
  detail?: string;
  id?: string;
  /** For trade items */
  name?: string;
  ticker?: string;
  type?: string;
  size?: string;
  slug?: string;
  /** For convergence cards */
  signal?: string;
  logic?: string;
  meaning?: string;
}

interface AiBriefingPanelProps {
  item: BriefableItem;
  onClose: () => void;
}

export function AiBriefingPanel({ item, onClose }: AiBriefingPanelProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    if (!item) return;

    const fetchBriefing = async () => {
      setLoading(true);
      setAnalysis(null);
      setSources([]);

      if (!GEMINI_KEY) {
        setAnalysis('BRIEFING_ENGINE_OFFLINE: VITE_GEMINI_API_KEY not set.');
        setLoading(false);
        return;
      }

      try {
        const systemPrompt =
          'Act as a high-level macro-financial analyst for a quantitative hedge fund. ' +
          'Analyze the specific market signal provided. Explain technical significance ' +
          '(Order Flow, Gamma, Insider intent), potential market impact, and identify ' +
          'recent news catalysts for the ticker using Google Search grounding. ' +
          'Keep it concise, cold, and tactical. Use bullet points for key risks.';

        const ticker = item.ticker || (item.tickers ? item.tickers.join(', ') : 'N/A');
        const userQuery = `Analyze Signal:
  Action: ${item.action || item.type || item.signal || 'N/A'}
  Ticker: ${ticker}
  Actor: ${item.name || item.source || 'Institutional'}
  Detail: ${item.detail || item.logic || item.meaning || 'N/A'}
  Volume: ${item.size || 'N/A'}
  ID: ${item.slug || item.id || 'N/A'}`;

        const payload = {
          contents: [{ parts: [{ text: userQuery }] }],
          tools: [{ google_search: {} }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        const response = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate?.content?.parts?.[0]?.text) {
          setAnalysis(candidate.content.parts[0].text);
          if (candidate.groundingMetadata?.groundingAttributions) {
            setSources(
              candidate.groundingMetadata.groundingAttributions
                .map((attr: any) => ({ uri: attr.web?.uri, title: attr.web?.title }))
                .filter((s: Source) => s.uri && s.title)
            );
          }
        } else {
          setAnalysis('No analysis returned — check API quota.');
        }
      } catch {
        setAnalysis('BRIEFING_ENGINE_OFFLINE: Connection to Oracle failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [item]);

  const displayTicker = item.ticker || (item.tickers ? item.tickers[0] : '—');
  const displayAction = item.action || item.type || item.signal || '—';
  const isBuy = displayAction.toLowerCase().includes('buy') || displayAction.includes('CONVERGENCE');

  return (
    <div className="oracle-panel">
      {/* Header */}
      <div className="oracle-panel__header">
        <div className="oracle-panel__title-group">
          <span className="oracle-panel__subtitle">Tactical Oracle</span>
          <span className="oracle-panel__title">AI_BRIEFING_NODE</span>
        </div>
        <button onClick={onClose} className="oracle-panel__close">✕</button>
      </div>

      {/* Body */}
      <div className="oracle-panel__body">
        {loading ? (
          <div className="oracle-panel__loading">
            <div className="oracle-panel__spinner" />
            <span className="oracle-panel__loading-text">Scanning Grid</span>
          </div>
        ) : (
          <>
            {/* Signal metadata */}
            <section className="oracle-panel__section">
              <span className="oracle-panel__section-title">Signal Metadata</span>
              <div className="oracle-panel__metadata">
                <div className="oracle-panel__meta-row">
                  <div>
                    <span className="oracle-panel__meta-label">Entity</span>
                    <span className="oracle-panel__meta-value">{item.name || item.source || 'Institutional'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="oracle-panel__meta-label">Status</span>
                    <span className={`oracle-panel__status ${isBuy ? 'oracle-panel__status--buy' : 'oracle-panel__status--sell'}`}>
                      {displayAction}
                    </span>
                  </div>
                </div>
                <div className="oracle-panel__meta-row">
                  <span className="oracle-panel__ticker">${displayTicker}</span>
                  <span className="oracle-panel__slug">ID: {item.slug || item.id || '—'}</span>
                </div>
              </div>
            </section>

            {/* Analysis */}
            <section className="oracle-panel__section">
              <span className="oracle-panel__section-title">Intelligence Analysis</span>
              <div className="oracle-panel__analysis">{analysis}</div>
            </section>

            {/* Sources */}
            {sources.length > 0 && (
              <section className="oracle-panel__section oracle-panel__sources">
                <span className="oracle-panel__section-title">Grounding Citations</span>
                <div className="oracle-panel__source-list">
                  {sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="oracle-panel__source-link">
                      <span>{s.title}</span>
                      <span className="oracle-panel__source-icon">↗</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
