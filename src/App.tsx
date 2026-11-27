import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { TodaysBrief } from './pages/TodaysBrief';
import { Dashboard } from './pages/Dashboard';
import { AgentX } from './pages/AgentX';
import { Feds } from './pages/Feds';
import { Politicians } from './pages/Politicians';
import { Exploit } from './pages/Exploit';
import { Signals } from './pages/Signals';
import { DarkPool } from './pages/DarkPool';
import { AXLFIIntel } from './pages/AXLFIIntel';
import { Gamma } from './pages/Gamma';
import { Squeeze } from './pages/Squeeze';
import { Options } from './pages/Options';
import { LiveSession } from './pages/LiveSession';
import { DataBlindBanner } from './components/ui/DataBlindBanner';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0.75rem 1.5rem 0' }}>
        <DataBlindBanner />
      </div>
      <Routes>
        <Route path="/" element={<TodaysBrief />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agent-x" element={<AgentX />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/feds" element={<Feds />} />
        <Route path="/politicians" element={<Politicians />} />
        <Route path="/exploit" element={<Exploit />} />
        <Route path="/darkpool" element={<DarkPool />} />
        <Route path="/axlfi" element={<AXLFIIntel />} />
        <Route path="/gamma" element={<Gamma />} />
        <Route path="/squeeze" element={<Squeeze />} />
        <Route path="/options" element={<Options />} />
        <Route path="/live" element={<LiveSession />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

