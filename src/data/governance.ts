import { supabase } from '../lib/supabase';
import type { ComplianceIssue, DemoUser, EcoSphereDatabase, Policy, PolicyAcknowledgement } from '../types';

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value);

export async function loadGovernanceDatabase(): Promise<Pick<EcoSphereDatabase, 'departments' | 'users' | 'policies' | 'policyAcknowledgements' | 'complianceIssues'>> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication is required.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (profileError || !profile) throw new Error(profileError?.message ?? 'Profile not found.');
  const [departments, profiles, policies, acknowledgements, issues] = await Promise.all([
    supabase.from('departments').select('id, organization_id, name, carbon_target_tonnes').eq('organization_id', profile.organization_id),
    supabase.from('profiles').select('id, organization_id, department_id, full_name, initials, title, role'),
    supabase.from('policies').select('id, organization_id, title, version, published_on, required_role'),
    supabase.from('policy_acknowledgements').select('id, policy_id, user_id, status, acknowledged_at'),
    supabase.from('compliance_issue_status').select('id, organization_id, department_id, owner_id, title, severity, status, due_date'),
  ]);
  const failed = [departments, profiles, policies, acknowledgements, issues].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  return {
    departments: ((departments.data ?? []) as Row[]).map((row) => ({ id: text(row.id), organizationId: text(row.organization_id), name: text(row.name), carbonTargetTonnes: Number(row.carbon_target_tonnes) })),
    users: ((profiles.data ?? []) as Row[]).map((row): DemoUser => ({ id: text(row.id), organizationId: text(row.organization_id), departmentId: text(row.department_id), name: text(row.full_name), initials: text(row.initials), title: text(row.title), role: row.role as DemoUser['role'], email: '' })),
    policies: ((policies.data ?? []) as Row[]).map((row): Policy => ({ id: text(row.id), organizationId: text(row.organization_id), title: text(row.title), version: text(row.version), publishedOn: text(row.published_on), requiredRole: row.required_role as Policy['requiredRole'] })),
    policyAcknowledgements: ((acknowledgements.data ?? []) as Row[]).map((row): PolicyAcknowledgement => ({ id: text(row.id), policyId: text(row.policy_id), userId: text(row.user_id), status: 'acknowledged', acknowledgedAt: text(row.acknowledged_at) })),
    complianceIssues: ((issues.data ?? []) as Row[]).map((row): ComplianceIssue => ({ id: text(row.id), organizationId: text(row.organization_id), departmentId: text(row.department_id), ownerId: text(row.owner_id), title: text(row.title), severity: row.severity as ComplianceIssue['severity'], status: row.status as ComplianceIssue['status'], dueDate: text(row.due_date) })),
  };
}

export async function acknowledgePolicy(policyId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication is required.');
  const { error } = await supabase.from('policy_acknowledgements').upsert({ policy_id: policyId, user_id: user.id, status: 'acknowledged', acknowledged_at: new Date().toISOString() }, { onConflict: 'policy_id,user_id' });
  if (error) throw new Error(error.message);
}

export async function saveComplianceIssue(issue: Omit<ComplianceIssue, 'id' | 'organizationId'> & { id?: string }): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication is required.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (profileError || !profile) throw new Error(profileError?.message ?? 'Profile not found.');
  const payload = { organization_id: profile.organization_id, department_id: issue.departmentId, owner_id: issue.ownerId, title: issue.title, severity: issue.severity, status: issue.status, due_date: issue.dueDate };
  const request = issue.id ? supabase.from('compliance_issues').update(payload).eq('id', issue.id) : supabase.from('compliance_issues').insert({ ...payload, created_by: user.id });
  const { error } = await request;
  if (error) throw new Error(error.message);
}
