import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button className={`button ${variant} ${className}`} {...props} />;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) { return <div className="empty-state"><div className="empty-glyph">✦</div><h3>{title}</h3><p>{detail}</p>{action}</div>; }
export function Skeleton({ className = '' }: { className?: string }) { return <div className={`skeleton ${className}`} aria-label="Loading" />; }
export function LoadingState({ label = 'Loading EcoSphere workspace' }: { label?: string }) { return <main className="loading-state" aria-live="polite"><div><p className="eyebrow">{label}</p><Skeleton className="loading-title"/><div className="loading-cards"><Skeleton/><Skeleton/><Skeleton/></div><Skeleton className="loading-panel"/></div></main>; }
export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) { if (!open) return null; return <div className="overlay" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}><div className="dialog-head"><h2>{title}</h2><Button variant="ghost" aria-label="Close" onClick={onClose}><X size={18} /></Button></div>{children}</div></div>; }
export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) { if (!open) return null; return <div className="overlay" role="presentation" onMouseDown={onClose}><aside className="drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}><div className="dialog-head"><h2>{title}</h2><Button variant="ghost" aria-label="Close" onClick={onClose}><X size={18} /></Button></div>{children}</aside></div>; }
