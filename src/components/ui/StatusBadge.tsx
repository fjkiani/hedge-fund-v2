/**
 * StatusBadge — WIN / LOSS / OPEN / FLAT / LONG / SHORT / WATCH / PREPARE badge.
 * Single source of truth for signal status styling.
 */

type Status = 'WIN' | 'LOSS' | 'OPEN' | 'FLAT' | 'LONG' | 'SHORT' | 'WATCH' | 'PREPARE';

const STATUS_CONFIG: Record<Status, { icon: string; cssClass: string }> = {
  WIN:     { icon: '✅', cssClass: 'ui-status--win' },
  LOSS:    { icon: '❌', cssClass: 'ui-status--loss' },
  OPEN:    { icon: '⏳', cssClass: 'ui-status--open' },
  FLAT:    { icon: '⚪', cssClass: 'ui-status--flat' },
  LONG:    { icon: '🟢', cssClass: 'ui-status--long' },
  SHORT:   { icon: '🔴', cssClass: 'ui-status--short' },
  WATCH:   { icon: '👁', cssClass: 'ui-status--watch' },
  PREPARE: { icon: '🎯', cssClass: 'ui-status--prepare' },
};

interface StatusBadgeProps {
  status: string;
  hideIcon?: boolean;
}

export function StatusBadge({ status, hideIcon }: StatusBadgeProps) {
  const key = status.toUpperCase() as Status;
  const config = STATUS_CONFIG[key] || STATUS_CONFIG.FLAT;

  return (
    <span className={`ui-status ${config.cssClass}`}>
      {!hideIcon && config.icon} {key}
    </span>
  );
}
