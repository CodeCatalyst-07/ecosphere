import { useState } from 'react';
import { AppShell } from './components/layout';
import { DemoAccess } from './components/demo-access';
import { repository } from './data/repository';
import { ChallengesPage, Dashboard, EnvironmentalPage, GovernancePage, PlaceholderPage } from './pages';
import type { Route } from './types';
export function App() { const [route, setRoute] = useState<Route>('dashboard'); const [user, setUser] = useState(() => repository.getSessionUser()); const [database, setDatabase] = useState(() => repository.getDatabase()); if (!user) return <DemoAccess users={database.users} onSelect={(id) => setUser(repository.signIn(id))}/>; const signOut = () => { repository.signOut(); setUser(undefined); setRoute('dashboard'); }; const refresh = () => setDatabase(repository.getDatabase()); return <AppShell route={route} onNavigate={setRoute} user={user} onSignOut={signOut}>{route === 'dashboard' ? <Dashboard database={database} /> : route === 'environmental' ? <EnvironmentalPage database={database} user={user} onActivityAdded={refresh} /> : route === 'governance' ? <GovernancePage database={database} user={user} onChanged={refresh} /> : route === 'challenges' ? <ChallengesPage database={database} user={user} onChanged={refresh} /> : <PlaceholderPage route={route}/>}</AppShell>; }
