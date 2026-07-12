import { supabase } from '../lib/supabase';

export type DashboardModel = {
  organizationName: string;
  asOfDate: string;
  scores: { esg: number; environmental: number; social: number; governance: number };
  carbonFootprintTonnes: number;
  departmentRanking: Array<{ departmentId: string; name: string; actualTonnes: number; targetTonnes: number; percentageUsed: number }>;
  carbonGoals: Array<{ id: string; title: string; targetTonnes: number; targetDate: string; status: 'on-track' | 'at-risk' | 'off-track'; actualTonnes: number; varianceTonnes: number; percentageUsed: number }>;
  governanceAlerts: Array<{ id: string; title: string; severity: 'low' | 'medium' | 'high'; dueDate: string; isOverdue: boolean; ownerName: string }>;
  governance: { activeRisks: number; overdueRisks: number; acknowledgementRate: number };
  participation: { averageProgress: number; participationCount: number; awaitingReview: number; approvedCount: number; pointsAwaitingApproval: number };
};

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value ?? '');
const number = (value: unknown) => Number(value ?? 0);
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const object = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};

export async function loadDashboard(): Promise<DashboardModel> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('get_dashboard');
  if (error) throw new Error(error.message);
  const result = object(data);
  const scores = object(result.scores);
  const governance = object(result.governance);
  const participation = object(result.participation);
  return {
    organizationName: text(result.organization_name), asOfDate: text(result.as_of_date),
    scores: { esg: number(scores.esg), environmental: number(scores.environmental), social: number(scores.social), governance: number(scores.governance) },
    carbonFootprintTonnes: number(result.carbon_footprint_tonnes),
    departmentRanking: rows(result.department_ranking).map((row) => ({ departmentId: text(row.department_id), name: text(row.name), actualTonnes: number(row.actual_tonnes), targetTonnes: number(row.target_tonnes), percentageUsed: number(row.percentage_used) })),
    carbonGoals: rows(result.carbon_goals).map((row) => ({ id: text(row.id), title: text(row.title), targetTonnes: number(row.target_tonnes), targetDate: text(row.target_date), status: text(row.status) as DashboardModel['carbonGoals'][number]['status'], actualTonnes: number(row.actual_tonnes), varianceTonnes: number(row.variance_tonnes), percentageUsed: number(row.percentage_used) })),
    governanceAlerts: rows(result.governance_alerts).map((row) => ({ id: text(row.id), title: text(row.title), severity: text(row.severity) as DashboardModel['governanceAlerts'][number]['severity'], dueDate: text(row.due_date), isOverdue: Boolean(row.is_overdue), ownerName: text(row.owner_name) })),
    governance: { activeRisks: number(governance.active_risks), overdueRisks: number(governance.overdue_risks), acknowledgementRate: number(governance.acknowledgement_rate) },
    participation: { averageProgress: number(participation.average_progress), participationCount: number(participation.participation_count), awaitingReview: number(participation.awaiting_review), approvedCount: number(participation.approved_count), pointsAwaitingApproval: number(participation.points_awaiting_approval) },
  };
}
