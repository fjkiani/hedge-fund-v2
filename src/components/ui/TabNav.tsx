/**
 * TabNav — Reusable tab bar with active state styling.
 */

interface Tab<T extends string = string> {
  key: T;
  label: string;
}

interface TabNavProps<T extends string = string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

export function TabNav<T extends string = string>({ tabs, active, onChange }: TabNavProps<T>) {
  return (
    <div className="ui-tabs">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`ui-tab ${active === t.key ? 'ui-tab--active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
