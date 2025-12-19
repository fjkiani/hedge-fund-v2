import { LayoutDashboard, Signal, TrendingUp, BarChart3, Zap, Activity } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Signal, label: 'Signals', path: '/signals' },
  { icon: TrendingUp, label: 'Dark Pool', path: '/darkpool' },
  { icon: BarChart3, label: 'Gamma', path: '/gamma' },
  { icon: Zap, label: 'Squeeze', path: '/squeeze' },
  { icon: Activity, label: 'Options', path: '/options' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-bg-secondary border-r border-border-subtle p-4">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

