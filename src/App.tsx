import { useState } from 'react';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import SpotDetailPage from './pages/SpotDetailPage';
import AddSpotPage from './pages/AddSpotPage';
import LogPage from './pages/LogPage';
import SettingsPage from './pages/SettingsPage';
import type { Spot, FishingScore } from './types';

type Tab = 'home' | 'log' | 'settings';
type View =
  | { name: 'tab' }
  | { name: 'spotDetail'; spot: Spot }
  | { name: 'addSpot' }
  | { name: 'logWithPrefill'; spot: Spot; score: FishingScore | null };

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [view, setView] = useState<View>({ name: 'tab' });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  // 子页面视图
  if (view.name === 'spotDetail') {
    return (
      <SpotDetailPage
        spot={view.spot}
        onBack={() => setView({ name: 'tab' })}
        onAddLog={(spot, score) => {
          setView({ name: 'logWithPrefill', spot, score });
          setTab('log');
        }}
      />
    );
  }

  if (view.name === 'addSpot') {
    return (
      <AddSpotPage
        onBack={() => setView({ name: 'tab' })}
        onSaved={() => {
          setView({ name: 'tab' });
          refresh();
        }}
      />
    );
  }

  // 主 Tab 视图
  return (
    <>
      {tab === 'home' && (
        <HomePage
          onSelectSpot={spot => setView({ name: 'spotDetail', spot })}
          onAddSpot={() => setView({ name: 'addSpot' })}
          refreshKey={refreshKey}
        />
      )}

      {tab === 'log' && (
        <LogPage
          refreshKey={refreshKey}
          onRefresh={refresh}
          prefillSpot={view.name === 'logWithPrefill' ? view.spot : null}
          prefillScore={view.name === 'logWithPrefill' ? view.score : null}
          onConsumedPrefill={() => setView({ name: 'tab' })}
        />
      )}

      {tab === 'settings' && <SettingsPage />}

      <BottomNav
        active={tab}
        onChange={(t) => {
          setTab(t as Tab);
          setView({ name: 'tab' });
        }}
      />
    </>
  );
}
