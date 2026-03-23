/**
 * ThesisBar — SPY position vs wall in plain English.
 * Click navigates to /dashboard.
 */

import { useNavigate } from 'react-router-dom';

interface ThesisBarProps {
  spy: {
    price: number;
    call_wall: number;
    delta_from_wall: number;
  };
}

export function ThesisBar({ spy }: ThesisBarProps) {
  const navigate = useNavigate();
  const delta = spy.delta_from_wall;
  const safe = delta > 0;

  const position = safe
    ? `SPY $${spy.price} — $${Math.abs(delta).toFixed(2)} above $${spy.call_wall} wall. Safe territory.`
    : `SPY $${spy.price} — $${Math.abs(delta).toFixed(2)} below $${spy.call_wall} wall. Danger zone.`;

  return (
    <div
      className={`thesis-bar ${safe ? 'thesis-bar--safe' : 'thesis-bar--danger'}`}
      onClick={() => navigate('/dashboard')}
      title="Click to view SPY chart"
    >
      <div>
        <div className="thesis-bar__label">THESIS STATUS</div>
        <div className="thesis-bar__position">{position}</div>
      </div>
      <div className={`thesis-bar__badge ${safe ? 'thesis-bar__badge--valid' : 'thesis-bar__badge--risk'}`}>
        {safe ? 'VALID' : 'AT RISK'}
      </div>
    </div>
  );
}
