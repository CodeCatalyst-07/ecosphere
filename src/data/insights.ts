import { supabase } from '../lib/supabase';
import type { Route } from '../types';

export type GeneratedInsight = { id: string; createdAt: string; priority: 'Critical' | 'High' | 'Opportunity'; title: string; recommendation: string; rationale: string; route: Route };

export async function generateInsight(): Promise<GeneratedInsight> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error, response } = await supabase.functions.invoke('generate-insight', { method: 'POST' });
  if (error) {
    const body = response ? await response.clone().json().catch(() => undefined) as { error?: string } | undefined : undefined;
    throw new Error(body?.error || error.message || 'Unable to generate an insight.');
  }
  if (data?.error) throw new Error(data.error);
  const recommendation = data?.recommendation ?? {};
  return { id: String(data?.id ?? ''), createdAt: String(data?.created_at ?? ''), priority: recommendation.priority === 'Critical' || recommendation.priority === 'High' ? recommendation.priority : 'Opportunity', title: String(recommendation.title ?? 'ESG recommendation'), recommendation: String(recommendation.recommendation ?? ''), rationale: String(recommendation.rationale ?? ''), route: ['environmental', 'governance', 'challenges'].includes(recommendation.route) ? recommendation.route : 'dashboard' };
}
