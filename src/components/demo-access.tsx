import { Leaf, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card } from './ui';

export function DemoAccess({ onSignIn, error }: { onSignIn: (email: string, password: string) => Promise<string | undefined>; error?: string }) {
  const [email, setEmail] = useState('alex@atlas.example');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(await onSignIn(email, password));
    setSubmitting(false);
  };

  return <main className="access-page"><section className="access-intro"><div className="access-brand"><span className="brand-mark"><Leaf size={17}/></span>EcoSphere</div><Badge tone="green">Secure workspace access</Badge><h1>One ESG story.<br/>Three ways to act.</h1><p>Sign in to view Atlas Industries from the right level of responsibility.</p><div className="access-note"><ShieldCheck size={17}/><span><b>Supabase protected</b><small>Authentication and data access are governed by Row Level Security.</small></span></div></section><section className="persona-panel"><p className="eyebrow">SIGN IN</p><h2>Enter Atlas Industries</h2><p className="persona-description">Use one of the configured demo accounts to access the workspace.</p><Card className="persona-card"><form onSubmit={submit} className="sign-in-form"><label>Email<input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} required autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={(event)=>setPassword(event.target.value)} required autoComplete="current-password"/></label>{(error || message) && <p className="sign-in-error">{error || message}</p>}<Button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : <><LockKeyhole size={16}/>Sign in</>}</Button></form></Card><div className="access-footer"><span><LockKeyhole size={14}/>Email/password authentication is enabled for this demo.</span></div></section></main>;
}
