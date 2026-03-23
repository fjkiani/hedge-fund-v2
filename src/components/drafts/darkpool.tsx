import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  BrainCircuit, 
  Zap, 
  Search, 
  ShieldCheck, 
  Cpu,
  RefreshCw,
  BarChart2,
  ArrowRight,
  AlertOctagon,
  ChevronDown,
  ChevronRight,
  Terminal,
  Info,
  TrendingUp,
  Target,
  Layers,
  Settings,
  Bell,
  ChevronUp,
  Flame,
  MousePointer2,
  CircleDot,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Ghost,
  Landmark,
  Gavel,
  Sword,
  Satellite,
  LineChart,
  DollarSign
} from 'lucide-react';

/**
 * Alpha Terminal - Dark Pool Flow Module
 * Recreating the high-fidelity institutional print dashboard
 */

// --- Mock Data ---

const DARK_POOL_LEVELS = [
  { price: 681.66, volume: 66.7, type: 'resistance' },
  { price: 675.20, volume: 42.1, type: 'battleground' },
  { price: 668.45, volume: 58.3, type: 'support' },
  { price: 659.72, volume: 31.9, type: 'support' },
];

const NAV_ITEMS = [
  { id: 'brief', label: "Today's Brief", icon: ClipboardList },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agentx', label: 'Agent X', icon: Ghost },
  { id: 'feds', label: 'The Feds', icon: Landmark },
  { id: 'politicians', label: 'Politicians', icon: Gavel },
  { id: 'exploit', label: 'Exploit', icon: Sword },
  { id: 'intel', label: 'AXLFI Intel', icon: Satellite },
  { id: 'gamma', label: 'Gamma', icon: LineChart },
];

// --- Components ---

const StatCard = ({ label, value, subtext, subtextColor = "text-zinc-500", valueColor = "text-white", children }) => (
  <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 flex-1 shadow-xl relative overflow-hidden group">
    <div className="flex flex-col gap-1 mb-4">
      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{label}</span>
      <h3 className={`text-4xl font-black ${valueColor} tracking-tighter`}>{value}</h3>
      <span className={`text-[11px] font-bold ${subtextColor}`}>{subtext}</span>
    </div>
    {children}
  </div>
);

const VolumeBarChart = ({ levels }) => {
  const [hovered, setHovered] = useState(null);
  const maxVolume = 80; // Scale based on screenshot max

  return (
    <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-8 mt-6 relative shadow-2xl">
      <div className="flex flex-col gap-1 mb-10">
        <h3 className="text-lg font-black text-white">Dark Pool Levels by Volume</h3>
        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest">Price levels with significant off-exchange activity</p>
      </div>

      <div className="relative h-80 w-full flex flex-col justify-between py-4">
        {/* X-Axis Labels */}
        <div className="absolute bottom-[-30px] w-full flex justify-between text-[9px] font-mono text-zinc-700 uppercase tracking-widest border-t border-white/5 pt-4">
          <span>0</span>
          <span>20.0M</span>
          <span>40.0M</span>
          <span>60.0M</span>
          <span>80.0M</span>
        </div>

        {/* Chart Content */}
        <div className="flex-1 space-y-8 relative">
          {levels.map((level, i) => (
            <div 
              key={i} 
              className="group relative flex items-center h-16"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-24 text-[11px] font-mono text-zinc-600 text-right pr-6">${level.price}</span>
              <div className="flex-1 relative h-full flex items-center">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(level.volume / maxVolume) * 100}%` }}
                  className={`h-full rounded-r-sm transition-opacity duration-300 ${
                    level.type === 'support' ? 'bg-[#10b981]' : 
                    level.type === 'resistance' ? 'bg-[#f43f5e]' : 'bg-[#eab308]'
                  } ${hovered !== null && hovered !== i ? 'opacity-30' : 'opacity-100'}`}
                />
                
                {/* Tooltip */}
                <AnimatePresence>
                  {hovered === i && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, x: 10 }}
                      animate={{ opacity: 1, scale: 1, x: 20 }}
                      exit={{ opacity: 0, scale: 0.9, x: 10 }}
                      className="absolute right-[-140px] z-50 bg-[#16161a] border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[120px]"
                    >
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">${level.price}</span>
                      <div className="flex justify-between items-baseline gap-4">
                        <span className="text-[10px] text-zinc-300 font-black uppercase">Volume</span>
                        <span className="text-sm font-black text-white">{level.volume}M</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-16 flex gap-6">
        {[
          { label: 'Support', color: 'bg-[#10b981]' },
          { label: 'Resistance', color: 'bg-[#f43f5e]' },
          { label: 'Battleground', color: 'bg-[#eab308]' }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [activePage, setActivePage] = useState('gamma'); // gamma = Dark Pool View
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050506] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-[10px] text-zinc-600 tracking-[0.5em] uppercase">Booting Alpha Terminal</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      
      {/* Top Global Navigation Bar */}
      <nav className="h-16 border-b border-white/5 bg-[#08080a] flex items-center justify-between px-10 z-[200]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600/10 rounded-lg">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">Alpha</span>
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all group ${
                activePage === item.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activePage === item.id ? 'text-purple-400' : 'text-zinc-700 group-hover:text-zinc-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">System Online</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 cursor-pointer hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </div>
        </div>
      </nav>

      <main className="flex-1 p-10 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {activePage === 'gamma' ? (
            <motion.div 
              key="dp-flow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-10"
            >
              {/* Header */}
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-white">Dark Pool Flow</h2>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
                    <span>SPY</span>
                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span>Off-exchange volume & institutional prints</span>
                  </div>
                </div>
                <div className="text-4xl font-black text-cyan-400 tracking-tighter">$659.72</div>
              </div>

              {/* Top Stat Cards */}
              <div className="flex gap-8">
                <StatCard 
                  label="Total Volume" 
                  value="17.2M" 
                  subtext="$45.5B notional" 
                />
                <StatCard 
                  label="DP %" 
                  value="55.9%" 
                  subtext="55.9% short vol" 
                  valueColor="text-emerald-500"
                  subtextColor="text-emerald-900"
                />
                <StatCard 
                  label="Buying Pressure" 
                  value="44.1%" 
                  subtext="Neutral Momentum" 
                  valueColor="text-rose-500"
                >
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-900">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "44.1%" }}
                      className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
                    />
                  </div>
                </StatCard>
              </div>

              {/* Levels Chart */}
              <VolumeBarChart levels={DARK_POOL_LEVELS} />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-800 font-black uppercase tracking-[1em]">
              Select Intelligence Module
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Footer */}
      <footer className="h-12 border-t border-white/5 bg-[#08080a]/80 backdrop-blur-xl flex items-center justify-between px-10 text-[9px] font-mono text-zinc-800 uppercase tracking-widest">
        <div className="flex gap-10">
          <span>Terminal ID: ALPHA_7X</span>
          <span>Latency: 4.1ms</span>
        </div>
        <span>&copy; 2026 Alpha Intelligence Network // Restricted Access</span>
      </footer>
    </div>
  );
}