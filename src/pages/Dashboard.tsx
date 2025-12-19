import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { WidgetGrid } from '../components/layout/WidgetGrid';
import { ChartTest } from '../components/charts/ChartTest';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <ChartTest />
          </div>
          <WidgetGrid />
        </main>
      </div>
    </div>
  );
}

