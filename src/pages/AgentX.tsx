import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { AgentXDashboard } from '../components/agentx/AgentXDashboard';

export function AgentX() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6">
                    <AgentXDashboard />
                </main>
            </div>
        </div>
    );
}
