import { useState, useEffect } from 'react';
import { TrendingUp, Sun, Moon } from 'lucide-react';

export function Header() {
  const [light, setLight] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (light) {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [light]);

  return (
    <header className="bg-bg-secondary border-b border-border-subtle px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            🎯 ALPHA TERMINAL
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">SPY</span>
            <span className="text-lg font-mono font-semibold text-text-primary">$665.20</span>
            <div className="flex items-center gap-1 text-accent-green">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+0.45%</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">QQQ</span>
            <span className="text-lg font-mono font-semibold text-text-primary">$520.10</span>
            <div className="flex items-center gap-1 text-accent-green">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">+0.62%</span>
            </div>
          </div>
          
          <div className="h-6 w-px bg-border-subtle" />
          
          {/* Theme toggle */}
          <button
            onClick={() => setLight(prev => !prev)}
            title={light ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-tertiary hover:bg-bg-hover transition-all text-text-secondary hover:text-text-primary"
          >
            {light ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="text-xs font-medium">{light ? 'Dark' : 'Light'}</span>
          </button>

          <div className="h-6 w-px bg-border-subtle" />
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
            <span className="text-sm text-text-secondary">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}

