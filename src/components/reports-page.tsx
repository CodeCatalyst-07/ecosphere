import { ArrowUpRight, BrainCircuit, FileDown, Leaf, ShieldCheck, Trophy } from 'lucide-react';
import { formatCarbon } from '../pages';
import type { Route } from '../types';
import type { DashboardModel } from '../data/dashboard';
import { Badge, Button, Card } from './ui';

export function ReportsPage({ dashboard, onNavigate }: { dashboard: DashboardModel; onNavigate: (route: Route) => void }) {
  const { scores } = dashboard;
  const goal = dashboard.carbonGoals[0];
  const issue = dashboard.governanceAlerts[0];
  const narrative = `${dashboard.organizationName} closes ${dashboard.asOfDate} with an ESG score of ${scores.esg}. Environmental performance ${goal?.varianceTonnes ? `needs immediate focus: ${goal.title} is ${formatCarbon(goal.varianceTonnes)} above its carbon target.` : 'is within its current goal threshold.'} Governance ${issue ? `remains exposed by ${issue.title}.` : 'has no open material alert.'} ${dashboard.governance.acknowledgementRate}% policy acknowledgement and ${dashboard.participation.approvedCount} verified challenge action${dashboard.participation.approvedCount === 1 ? '' : 's'} show the current accountability and engagement position.`;

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
        <strong>{scores.esg}</strong><span>overall ESG score</span>
        <p>Prepared from trusted operational, compliance, and participation records on {dashboard.asOfDate}.</p>
      </div>
      <div className="report-pillar-summary">
        <div><Leaf size={17} /><span>Environmental</span><b>{scores.environmental}</b></div>
        <div><Trophy size={17} /><span>Social</span><b>{scores.social}</b></div>
        <div><ShieldCheck size={17} /><span>Governance</span><b>{scores.governance}</b></div>
      </div>
    </section>

    <section className="report-grid">
      <Card className="report-section">
        <div className="section-label">CARBON GOAL STATUS <Badge tone={goal?.varianceTonnes ? 'red' : 'green'}>{goal?.varianceTonnes ? 'Off track' : 'On track'}</Badge></div>
        <h2>{goal?.title ?? 'No carbon goal configured'}</h2>
        <strong>{formatCarbon(goal?.actualTonnes ?? 0)} <small>of {goal?.targetTonnes ?? 0} tCO₂e target</small></strong>
        <div className="goal-progress"><i style={{ width: `${Math.min(goal?.percentageUsed ?? 0, 100)}%` }} /></div>
        <p>{goal?.varianceTonnes ? `${formatCarbon(goal.varianceTonnes)} above plan. Prioritize fleet efficiency and reduce avoidable fuel activity before month end.` : 'The carbon goal is within its planned threshold.'}</p>
        <Button variant="secondary" onClick={() => onNavigate('environmental')}>View carbon ledger <ArrowUpRight size={15} /></Button>
      </Card>

      <Card className="report-section risk-report">
        <div className="section-label">GOVERNANCE RISK <Badge tone={issue ? 'red' : 'green'}>{issue ? 'Action required' : 'Controlled'}</Badge></div>
        <h2>{issue?.title ?? 'No material issues open'}</h2>
        <strong>{issue ? `Due ${issue.dueDate}` : `${dashboard.governance.acknowledgementRate}%`} <small>{issue ? 'open issue' : 'policy acknowledgement'}</small></strong>
        <p>{issue ? `Owned by ${issue.ownerName}. Close the evidence gap before reporting to protect governance performance.` : 'Policy and compliance records are in a healthy position.'}</p>
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
