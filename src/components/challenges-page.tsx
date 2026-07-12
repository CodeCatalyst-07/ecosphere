import { Award, CheckCircle2, FileText, Send, Trophy, Upload, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { approveParticipation, submitParticipation } from '../data/challenges';
import type { DemoUser, EcoSphereDatabase } from '../types';
import { Badge, Button, Card, EmptyState, Modal } from './ui';

export function ChallengesPage({ database, user, onChanged }: { database: EcoSphereDatabase; user: DemoUser; onChanged: () => Promise<void> }) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [recognition, setRecognition] = useState<string>();
  const [error, setError] = useState<string>();
  const [approving, setApproving] = useState<string>();
  const activeChallenges = database.challenges.filter((item) => item.status === 'active');
  // Prefer an active challenge the current employee can still act on. This
  // keeps a completed demo challenge from hiding a newly created challenge.
  const preferredChallenge = user.role === 'employee'
    ? activeChallenges.find((item) => database.participations.find((participation) => participation.challengeId === item.id && participation.userId === user.id)?.status !== 'approved')
    : activeChallenges.find((item) => database.participations.some((participation) => participation.challengeId === item.id && participation.status === 'submitted'));
  const challenge = preferredChallenge ?? activeChallenges[0];
  if (!challenge) return <EmptyState title="No active challenge" detail="Create an active challenge to begin collecting participation." />;
  const mine = database.participations.find((item) => item.challengeId === challenge.id && item.userId === user.id);
  const points = database.pointsLedger.filter((item) => item.userId === user.id).reduce((sum, item) => sum + item.points, 0);
  const myBadges = database.badges.filter((item) => item.userId === user.id);
  const entries = database.participations.filter((item) => item.challengeId === challenge.id).map((item) => ({ item, person: database.users.find((candidate) => candidate.id === item.userId) })).filter((entry): entry is { item: EcoSphereDatabase['participations'][number]; person: DemoUser } => Boolean(entry.person)).sort((a, b) => b.item.progress - a.item.progress);
  const pending = entries.filter((entry) => entry.item.status === 'submitted');
  const approve = async (id: string, name: string) => {
    setApproving(id); setError(undefined);
    try {
      const result = await approveParticipation(id);
      await onChanged();
      setRecognition(`${name} received ${result.points} EcoPoints${result.awardedBadge ? ` and unlocked the ${result.awardedBadge} badge` : ''}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to approve participation.'); }
    finally { setApproving(undefined); }
  };
  return <>
    <section className="page-intro"><div><p className="eyebrow">SOCIAL PILLAR · ACTIVE CHALLENGE</p><h1>Participation that compounds.</h1><p>Recognize verified employee action and make progress visible across the organization.</p></div>{user.role === 'employee' && (mine?.status === 'approved' ? <Badge tone="green"><CheckCircle2 size={15} />Participation approved</Badge> : <Button onClick={() => setSubmitOpen(true)}><Send size={15} />Submit progress</Button>)}</section>
    <section className="challenge-hero"><div><Badge tone="green">Active through {challenge.endsOn}</Badge><h2>{challenge.title}</h2><p>Choose lower-carbon journeys this month. Submit verified progress to earn recognition and {challenge.pointReward} EcoPoints.</p><div className="challenge-meta"><span><Trophy size={15} />{challenge.pointReward} EcoPoints</span><span><UserCheck size={15} />{entries.length} participant{entries.length === 1 ? '' : 's'}</span></div></div><div className="hero-progress"><strong>{mine?.progress ?? 0}%</strong><span>your progress</span><div><i style={{ width: `${mine?.progress ?? 0}%` }} /></div>{mine && <Badge tone={mine.status === 'approved' ? 'green' : 'amber'}>{mine.status === 'approved' ? 'Approved' : 'Awaiting review'}</Badge>}</div></section>
    <section className="challenge-grid"><Card className="recognition-card"><div className="section-label">YOUR RECOGNITION <Award size={14} /></div><strong>{points}</strong><span>EcoPoints balance</span><div className="badge-list">{myBadges.length ? myBadges.map((badge) => <div key={badge.id}><Award size={16} /><span><b>{badge.name}</b><small>Awarded {badge.awardedAt}</small></span></div>) : <p>Complete an approved action to unlock your first badge.</p>}</div></Card><Card className="leaderboard-card"><div className="section-label">COMPACT LEADERBOARD <span>Progress</span></div>{entries.map((entry, index) => <div className="leader-row" key={entry.item.id}><b>0{index + 1}</b><span className="avatar">{entry.person.initials}</span><div><strong>{entry.person.name}</strong><small>{entry.item.status === 'approved' ? 'Verified' : 'In review'}</small></div><b>{entry.item.progress}%</b></div>)}</Card></section>
    {user.role !== 'employee' && <Card className="review-card"><div className="table-head"><div><p className="eyebrow">MANAGER REVIEW</p><h2>Evidence awaiting approval</h2><p>Approve verified participation to award points and trigger badge rules.</p></div><Badge tone={pending.length ? 'amber' : 'green'}>{pending.length ? `${pending.length} pending` : 'All reviewed'}</Badge></div>{error && <p className="sign-in-error">{error}</p>}{pending.length ? pending.map(({ item, person }) => <div className="review-row" key={item.id}><span className="avatar">{person.initials}</span><div><strong>{person.name} · {item.progress}% progress</strong><p>{item.evidence}</p>{item.evidenceFile && <p><FileText size={14} /> Attached: {item.evidenceFile.fileName}</p>}</div><Button disabled={approving === item.id} onClick={() => void approve(item.id, person.name)}><CheckCircle2 size={15} />{approving === item.id ? 'Approving…' : `Approve +${challenge.pointReward}`}</Button></div>) : <EmptyState title="Nothing waiting for review" detail="New employee submissions will appear here with their evidence." />}</Card>}
    <ParticipationModal open={submitOpen && mine?.status !== 'approved'} onClose={() => setSubmitOpen(false)} challengeId={challenge.id} organizationId={challenge.organizationId} existing={mine} onSaved={async () => { await onChanged(); setSubmitOpen(false); }} />
    <Modal open={!!recognition} title="Recognition awarded" onClose={() => setRecognition(undefined)}><div className="recognition-modal"><CheckCircle2 size={32} /><h3>Approval complete</h3><p>{recognition}</p><Button onClick={() => setRecognition(undefined)}>Continue</Button></div></Modal>
  </>;
}

function ParticipationModal({ open, onClose, challengeId, organizationId, existing, onSaved }: { open: boolean; onClose: () => void; challengeId: string; organizationId: string; existing?: EcoSphereDatabase['participations'][number]; onSaved: () => Promise<void> }) {
  const [progress, setProgress] = useState(existing?.progress ?? 80);
  const [evidence, setEvidence] = useState(existing?.evidence ?? '');
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setProgress(existing?.progress ?? 80); setEvidence(existing?.evidence ?? ''); setFile(undefined); setError(undefined); } }, [open, existing]);
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(undefined); try { await submitParticipation({ challengeId, organizationId, progress, evidence, file }); await onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to submit participation.'); } finally { setSaving(false); } };
  return <Modal open={open} title="Submit challenge progress" onClose={onClose}><form className="activity-form" onSubmit={(event) => void save(event)}><label>Progress ({progress}%)<input type="range" min="1" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></label><label>Evidence summary<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Describe your verified low-carbon commutes" required /></label><label>Supporting file <small>(optional · PDF, JPEG, PNG, or WebP · 10 MB max)</small><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0])} />{existing?.evidenceFile && !file && <small>Current file: {existing.evidenceFile.fileName}</small>}</label>{file && <p className="file-selection"><Upload size={14} />{file.name}</p>}{error && <p className="sign-in-error">{error}</p>}<div className="calculation-preview"><span>Ready for review</span><strong>{progress}%</strong><small>Your manager will verify the evidence, then award EcoPoints.</small></div><div className="form-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}><Send size={15} />{saving ? 'Submitting…' : 'Submit for review'}</Button></div></form></Modal>;
}
