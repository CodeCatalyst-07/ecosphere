import { useEffect, useState } from 'react';
import { AppShell } from './components/layout';
import { DemoAccess } from './components/demo-access';
import { LoadingState } from './components/ui';
import { ReportsPage } from './components/reports-page';
import { repository } from './data/repository';
import { ChallengesPage, Dashboard, EnvironmentalPage, GovernancePage, PlaceholderPage } from './pages';
import type { Route } from './types';

export function App() {
  const [route, setRoute] = useState<Route>('dashboard');
  const [user, setUser] = useState(() => repository.getSessionUser());
  const [database, setDatabase] = useState(() => repository.getDatabase());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => setIsReady(true), []);

  if (!isReady) return <LoadingState />;
  if (!user) return <DemoAccess users={database.users} onSelect={(id) => setUser(repository.signIn(id))} onReset={() => setDatabase(repository.reset())} />;

  const signOut = () => {
    repository.signOut();
    setUser(undefined);
    setRoute('dashboard');
  };
  const refresh = () => setDatabase(repository.getDatabase());

  const page = route === 'dashboard'
    ? <Dashboard database={database} onNavigate={setRoute} />
    : route === 'environmental'
      ? <EnvironmentalPage database={database} user={user} onActivityAdded={refresh} />
      : route === 'governance'
        ? <GovernancePage database={database} user={user} onChanged={refresh} />
        : route === 'challenges'
          ? <ChallengesPage database={database} user={user} onChanged={refresh} />
          : route === 'reports'
            ? <ReportsPage database={database} onNavigate={setRoute} />
            : <PlaceholderPage route={route} />;

  return <AppShell route={route} onNavigate={setRoute} user={user} database={database} onSignOut={signOut}>{page}</AppShell>;
}
