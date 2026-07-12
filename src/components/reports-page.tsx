import { ArrowUpRight, BrainCircuit, FileDown, Leaf, ShieldCheck, Trophy } from 'lucide-react';
import { formatCarbon, pillarScore } from '../pages';
import type { EcoSphereDatabase, Route } from '../types';
import { Badge, Button, Card } from './ui';

export function ReportsPage({ database, onNavigate }: { database: EcoSphereDatabase; onNavigate: (route: Route) => void }) {
  const environmental = pillarScore(database, 'environmental');
  const social = pillarScore(database, 'social');
  const governance = pillarScore(database, 'governance');
  const esg = Math.round(environmental * 0.4 + social * 0.3 + governance * 0.3);
  const goal = database.sustainabilityGoals[0];
  const actual = database.carbonTransactions
    .filter((transaction) => transaction.departmentId === goal.departmentId)
    .reduce((sum, transaction) => sum + transaction.tonnesCo2e, 0);
  const variance = Math.max(0, actual - goal.targetTonnes);
  const issue = database.complianceIssues.find((item) => item.severity === 'high' && item.status !== 'resolved');
  const acknowledgementRate = Math.round(
    (database.policyAcknowledgements.filter((item) => item.status === 'acknowledged').length / database.users.length) * 100,
  );
  const activeChallenge = database.challenges.find((item) => item.status === 'active');
  const approved = database.participations.filter(
    (item) => item.challengeId === activeChallenge?.id && item.status === 'approved',
  ).length;
  const narrative = `Atlas Industries closes July with an ESG score of ${esg}. Environmental performance needs immediate focus: Operations is ${formatCarbon(variance)} above its carbon target. Governance remains exposed by ${issue ? 'an overdue high-severity evidence gap' : 'no high-severity open issues'}, while ${acknowledgementRate}% policy acknowledgement and ${approved} verified challenge action${approved === 1 ? '' : 's'} show a foundation for stronger accountability and engagement.`;

  return <>
    <section className="page-intro report-intro">
      <div>
        <p className="eyebrow">EXECUTIVE REPORT · JULY 2026</p>
        <h1>ESG summary report</h1>
        <p>A decision-ready view of operating impact, governance exposure, and employee action.</p>
      </div>
      <Button onClick={() => window.print()}><FileDown size={16} />Print report</Button>
    </section>

    <section className="report-cover">
      <div>
        <span className="section-label">ATLAS INDUSTRIES · ESG PERFORMANCE</span>
        <strong>{esg}</strong><span>overall ESG score</span>
        <p>Prepared from live operational, compliance, and participation records on July 12, 2026.</p>
      </div>
      <div className="report-pillar-summary">
        <div><Leaf size={17} /><span>Environmental</span><b>{environmental}</b></div>
        <div><Trophy size={17} /><span>Social</span><b>{social}</b></div>
        <div><ShieldCheck size={17} /><span>Governance</span><b>{governance}</b></div>
      </div>
    </section>

    <section className="report-grid">
      <Card className="report-section">
        <div className="section-label">CARBON GOAL STATUS <Badge tone={variance > 0 ? 'red' : 'green'}>{variance > 0 ? 'Off track' : 'On track'}</Badge></div>
        <h2>{goal.title}</h2>
        <strong>{formatCarbon(actual)} <small>of {goal.targetTonnes} tCO₂e target</small></strong>
        <div className="goal-progress"><i style={{ width: `${Math.min((actual / goal.targetTonnes) * 100, 100)}%` }} /></div>
        <p>{variance > 0 ? `${formatCarbon(variance)} above plan. Prioritize fleet efficiency and reduce avoidable fuel activity before month end.` : 'The carbon goal is within its planned threshold.'}</p>
        <Button variant="secondary" onClick={() => onNavigate('environmental')}>View carbon ledger <ArrowUpRight size={15} /></Button>
      </Card>

      <Card className="report-section risk-report">
        <div className="section-label">GOVERNANCE RISK <Badge tone={issue ? 'red' : 'green'}>{issue ? 'Action required' : 'Controlled'}</Badge></div>
        <h2>{issue?.title ?? 'No material issues open'}</h2>
        <strong>{issue ? `Due ${issue.dueDate}` : `${acknowledgementRate}%`} <small>{issue ? 'high-severity issue' : 'policy acknowledgement'}</small></strong>
        <p>{issue ? `Owned by ${database.users.find((user) => user.id === issue.ownerId)?.name}. Close the evidence gap before reporting to protect governance performance.` : 'Policy and compliance records are in a healthy position.'}</p>
        <Button variant="secondary" onClick={() => onNavigate('governance')}>Review governance <ArrowUpRight size={15} /></Button>
      </Card>

      <Card className="report-section narrative-report">
        <div className="section-label">INSIGHT ENGINE EXECUTIVE NARRATIVE <BrainCircuit size={15} /></div>
        <h2>Management readout</h2>
        <p>{narrative}</p>
        <div className="report-sources"><span>Live structured metrics</span><span>Explainable sources</span></div>
      </Card>
    </section>

    <Card className="report-actions">
      <div><p className="eyebrow">RECOMMENDED NEXT MOVES</p><h2>Close the loop on this month’s signals</h2></div>
      <div>
        <button onClick={() => onNavigate('environmental')}><b>01</b><span>Recover Operations’ carbon target</span><ArrowUpRight size={16} /></button>
        <button onClick={() => onNavigate('governance')}><b>02</b><span>Resolve the overdue compliance evidence</span><ArrowUpRight size={16} /></button>
        <button onClick={() => onNavigate('challenges')}><b>03</b><span>Convert submitted participation into recognition</span><ArrowUpRight size={16} /></button>
      </div>
    </Card>
  </>;
}
