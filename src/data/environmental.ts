import { supabase } from '../lib/supabase';
import { seedDatabase } from './seed';
import type { EcoSphereDatabase } from '../types';

type Row = Record<string, unknown>;
const number = (value: unknown) => Number(value);
const text = (value: unknown) => String(value);

/** Loads only the S2 environmental read model. Other pillars remain local until
 * their respective migration phases replace them. */
export async function loadEnvironmentalDatabase(): Promise<Pick<EcoSphereDatabase, 'organization' | 'departments' | 'emissionFactors' | 'operationalRecords' | 'carbonTransactions' | 'sustainabilityGoals'>> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication is required.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  if (profileError || !profile) throw new Error(profileError?.message ?? 'Profile not found.');

  const organizationId = profile.organization_id;
  const [organizationResult, departmentsResult, factorsResult, goalsResult, recordsResult, transactionsResult] = await Promise.all([
    supabase.from('organizations').select('id, name, sector, created_at').eq('id', organizationId).single(),
    supabase.from('departments').select('id, organization_id, name, carbon_target_tonnes').eq('organization_id', organizationId),
    supabase.from('emission_factors').select('id, name, activity_unit, co2e_per_unit, source, category').eq('organization_id', organizationId),
    supabase.from('sustainability_goals').select('id, organization_id, department_id, title, target_tonnes, target_date, status').eq('organization_id', organizationId),
    supabase.from('operational_records').select('id, organization_id, department_id, factor_id, quantity, unit, occurred_on, created_by, note').eq('organization_id', organizationId),
    supabase.from('carbon_transactions').select('id, operational_record_id, department_id, tonnes_co2e, calculated_at').eq('organization_id', organizationId),
  ]);
  const failed = [organizationResult, departmentsResult, factorsResult, goalsResult, recordsResult, transactionsResult].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  const organization = organizationResult.data as Row;
  return {
    organization: { id: text(organization.id), name: text(organization.name), sector: text(organization.sector), createdAt: text(organization.created_at) },
    departments: ((departmentsResult.data ?? []) as Row[]).map((row) => ({ id: text(row.id), organizationId: text(row.organization_id), name: text(row.name), carbonTargetTonnes: number(row.carbon_target_tonnes) })),
    emissionFactors: ((factorsResult.data ?? []) as Row[]).map((row) => ({ id: text(row.id), name: text(row.name), activityUnit: text(row.activity_unit), co2ePerUnit: number(row.co2e_per_unit), source: text(row.source), category: row.category as 'fleet' | 'electricity' | 'waste' })),
    sustainabilityGoals: ((goalsResult.data ?? []) as Row[]).map((row) => ({ id: text(row.id), organizationId: text(row.organization_id), departmentId: text(row.department_id), title: text(row.title), targetTonnes: number(row.target_tonnes), targetDate: text(row.target_date), status: row.status as 'on-track' | 'at-risk' | 'off-track' })),
    operationalRecords: ((recordsResult.data ?? []) as Row[]).map((row) => ({ id: text(row.id), organizationId: text(row.organization_id), departmentId: text(row.department_id), factorId: text(row.factor_id), quantity: number(row.quantity), unit: text(row.unit), occurredOn: text(row.occurred_on), createdBy: text(row.created_by), note: text(row.note) })),
    carbonTransactions: ((transactionsResult.data ?? []) as Row[]).map((row) => ({ id: text(row.id), operationalRecordId: text(row.operational_record_id), departmentId: text(row.department_id), tonnesCo2e: number(row.tonnes_co2e), calculatedAt: text(row.calculated_at) })),
  };
}

export async function refreshEnvironmentalDatabase(): Promise<EcoSphereDatabase> {
  const environmental = await loadEnvironmentalDatabase();
  return { ...seedDatabase, ...environmental };
}

export async function calculateCarbon(input: { departmentId: string; factorId: string; quantity: number; occurredOn: string; note: string }): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.functions.invoke('calculate-carbon', {
    body: { department_id: input.departmentId, factor_id: input.factorId, quantity: input.quantity, occurred_on: input.occurredOn, note: input.note },
  });
  if (error) throw new Error(error.message || 'The carbon calculation could not be completed.');
}
