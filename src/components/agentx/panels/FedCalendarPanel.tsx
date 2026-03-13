/**
 * FedCalendarPanel — Upcoming FOMC meetings, speeches, minutes releases
 * Signal: "When to brace for volatility"
 */

import { Card } from '../../ui/Card';
import type { CalendarEvent } from '../types';

interface Props {
    events: CalendarEvent[];
}

export function FedCalendarPanel({ events }: Props) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <h3 className="card-title text-base">Upcoming Fed Events</h3>
                </div>
                <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    background: events.length > 0 ? 'rgba(250, 204, 21, 0.15)' : 'rgba(100,100,100,0.15)',
                    color: events.length > 0 ? '#facc15' : '#94a3b8',
                    border: `1px solid ${events.length > 0 ? 'rgba(250, 204, 21, 0.3)' : 'rgba(100,100,100,0.2)'}`,
                }}>
                    {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
            </div>

            {events.length > 0 ? (
                <div className="space-y-2">
                    {events.map((evt, i) => (
                        <div key={i} className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-text-primary">{evt.title}</span>
                                <span style={{
                                    fontSize: '0.625rem',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    background: evt.title.toLowerCase().includes('fomc')
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(59, 130, 246, 0.15)',
                                    color: evt.title.toLowerCase().includes('fomc')
                                        ? '#ef4444'
                                        : '#3b82f6',
                                    fontWeight: 600,
                                }}>
                                    {evt.title.toLowerCase().includes('fomc') ? '⚠️ HIGH' : '🔵 MED'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                <span>📆 {evt.date}</span>
                                {evt.speaker && <span>• 🎤 {evt.speaker}</span>}
                                {evt.location && <span>• 📍 {evt.location}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">📭</span>
                    <span className="text-sm">No upcoming Fed events</span>
                    <span className="text-xs mt-1">Calendar polling federalreserve.gov</span>
                </div>
            )}
        </Card>
    );
}
