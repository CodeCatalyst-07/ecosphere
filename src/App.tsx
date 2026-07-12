import { useState } from 'react';
import { AppShell } from './components/layout';
import { DemoAccess } from './components/demo-access';
import { repository } from './data/repository';
import { Dashboard, PlaceholderPage } from './pages';
import type { Route } from './types';
export function App() { const [route, setRoute] = useState<Route>('dashboard'); const [user, setUser] = useState(() => repository.getSessionUser()); const database = repository.getDatabase(); if (!user) return <DemoAccess users={database.users} onSelect={(id) => setUser(repository.signIn(id))}/>; const signOut = () => { repository.signOut(); setUser(undefined); setRoute('dashboard'); }; return <AppShell route={route} onNavigate={setRoute} user={user} onSignOut={signOut}>{route === 'dashboard' ? <Dashboard /> : <PlaceholderPage route={route}/>}</AppShell>; }
