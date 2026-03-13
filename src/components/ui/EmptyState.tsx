/**
 * EmptyState — Loading spinner, empty message, or error with retry.
 * Replaces the raw <div className="text-center py-8 text-text-muted">Loading...</div> pattern.
 */

interface EmptyStateProps {
  loading?: boolean;
  message?: string;
  error?: string;
  icon?: string;
  onRetry?: () => void;
}

export function EmptyState({ loading, message, error, icon, onRetry }: EmptyStateProps) {
  if (loading) {
    return (
      <div className="ui-empty">
        <div className="ui-empty__spinner" />
        <span className="ui-empty__message">{message || 'Loading…'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ui-empty">
        <span className="ui-empty__icon">⚠️</span>
        <span className="ui-empty__message">{error}</span>
        {onRetry && (
          <button onClick={onRetry} className="ui-empty__retry">
            ↻ Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="ui-empty">
      {icon && <span className="ui-empty__icon">{icon}</span>}
      <span className="ui-empty__message">{message || 'No data'}</span>
    </div>
  );
}
