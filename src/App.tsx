import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Dashboard } from './pages/Dashboard';
import { AgentX } from './pages/AgentX';
import { Feds } from './pages/Feds';
import { Politicians } from './pages/Politicians';
import { Exploit } from './pages/Exploit';
import { Signals } from './pages/Signals';
import { DarkPool } from './pages/DarkPool';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agent-x" element={<AgentX />} />
        <Route path="/signals" element={<Signals />} />
        <Route path="/feds" element={<Feds />} />
        <Route path="/politicians" element={<Politicians />} />
        <Route path="/exploit" element={<Exploit />} />
        <Route path="/darkpool" element={<DarkPool />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

