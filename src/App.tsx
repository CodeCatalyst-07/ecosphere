import { useEffect, useState } from 'react';
import { AppShell } from './components/layout';
import { DemoAccess } from './components/demo-access';
import { LoadingState } from './components/ui';
import { ReportsPage } from './components/reports-page';
import { Dashboard } from './components/dashboard';
import { repository } from './data/repository';
import { refreshEnvironmentalDatabase } from './data/environmental';
import { loadGovernanceDatabase } from './data/governance';
import { loadChallengesDatabase } from './data/challenges';
import { loadDashboard, type DashboardModel } from './data/dashboard';
import { supabase } from './lib/supabase';
import { EnvironmentalPage, GovernancePage, PlaceholderPage } from './pages';
import { ChallengesPage } from './components/challenges-page';
import type { Route } from './types';

export function App() {
  const [route, setRoute] = useState<Route>('dashboard');
  const [user, setUser] = useState(() => repository.getSessionUser());
  const [database, setDatabase] = useState(() => repository.getDatabase());
  const [dashboard, setDashboard] = useState<DashboardModel>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) { setIsReady(true); return; }
    const restoreSession = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        try { setDatabase(await refreshEnvironmentalDatabase()); }
        catch (error) { console.error('Unable to load the Supabase environmental ledger.', error); }
        try {
          const governance = await loadGovernanceDatabase();
          const challenges = await loadChallengesDatabase();
          setDatabase((current) => ({ ...current, ...governance, ...challenges }));
          setUser(governance.users.find((candidate) => candidate.id === session.user.id));
          setDashboard(await loadDashboard());
        } catch (error) { console.error('Unable to load the Supabase governance workspace.', error); setUser(undefined); }
      } else {
        setUser(undefined);
      }
      setIsReady(true);
    };
    void restoreSession();
    const { data: { subscription } } = client.auth.onAuthStateChange(() => { void restoreSession(); });
    return () => subscription.unsubscribe();
  }, []);

  if (!isReady) return <LoadingState />;
  if (!user) return <DemoAccess error={!supabase ? 'Supabase is not configured for this environment.' : undefined} onSignIn={async (email, password) => {
    if (!supabase) return 'Supabase is not configured for this environment.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return 'Unable to sign in. Check your email and password.';
    return undefined;
  }} />;

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    repository.signOut();
    setUser(undefined);
    setRoute('dashboard');
  };
  const refresh = async () => {
    try {
      const governance = await loadGovernanceDatabase();
      const challenges = await loadChallengesDatabase();
      setDatabase((current) => ({ ...current, ...governance, ...challenges }));
      setDashboard(await loadDashboard());
    }
    catch (error) { console.error('Unable to refresh governance data.', error); }
  };
  const refreshEnvironmental = async () => {
    setDatabase(await refreshEnvironmentalDatabase());
    setDashboard(await loadDashboard());
  };

  const page = route === 'dashboard'
    ? dashboard ? <Dashboard dashboard={dashboard} onNavigate={setRoute} /> : <LoadingState />
    : route === 'environmental'
      ? <EnvironmentalPage database={database} user={user} onActivityAdded={refreshEnvironmental} />
      : route === 'governance'
        ? <GovernancePage database={database} user={user} onChanged={refresh} />
        : route === 'challenges'
          ? <ChallengesPage database={database} user={user} onChanged={refresh} />
          : route === 'reports'
            ? dashboard ? <ReportsPage dashboard={dashboard} onNavigate={setRoute} /> : <LoadingState />
            : <PlaceholderPage route={route} />;

  return <AppShell route={route} onNavigate={setRoute} user={user} database={database} onSignOut={signOut}>{page}</AppShell>;
}
