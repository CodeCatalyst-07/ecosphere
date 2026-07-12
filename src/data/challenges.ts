import { supabase } from '../lib/supabase';
import type { Badge, Challenge, EcoSphereDatabase, EvidenceFile, Participation, PointsLedger } from '../types';

type Row = Record<string, unknown>;
const text = (value: unknown) => String(value);

export async function loadChallengesDatabase(): Promise<Pick<EcoSphereDatabase, 'challenges' | 'participations' | 'pointsLedger' | 'badges'>> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [challenges, participations, points, badges, evidence] = await Promise.all([
    supabase.from('challenges').select('id, organization_id, title, starts_on, ends_on, point_reward, status'),
    supabase.from('challenge_participations').select('id, challenge_id, user_id, progress, status, evidence'),
    supabase.from('points_ledger').select('id, user_id, participation_id, points, reason, created_at'),
    supabase.from('employee_badges').select('id, user_id, name, awarded_at'),
    supabase.from('evidence_files').select('id, participation_id, file_name, mime_type, byte_size, storage_path'),
  ]);
  // S6 is intentionally additive: an incomplete Storage migration must not
  // turn an otherwise valid authenticated session into a login failure.
  const failed = [challenges, participations, points, badges].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (evidence.error && evidence.error.code !== '42P01') throw new Error(evidence.error.message);
  const evidenceByParticipation = new Map(((evidence.data ?? []) as Row[]).map((row): [string, EvidenceFile] => [text(row.participation_id), { id: text(row.id), participationId: text(row.participation_id), fileName: text(row.file_name), mimeType: text(row.mime_type), byteSize: Number(row.byte_size), storagePath: text(row.storage_path) }]));
  return {
    challenges: ((challenges.data ?? []) as Row[]).map((row): Challenge => ({ id: text(row.id), organizationId: text(row.organization_id), title: text(row.title), startsOn: text(row.starts_on), endsOn: text(row.ends_on), pointReward: Number(row.point_reward), status: row.status as Challenge['status'] })),
    participations: ((participations.data ?? []) as Row[]).map((row): Participation => ({ id: text(row.id), challengeId: text(row.challenge_id), userId: text(row.user_id), progress: Number(row.progress), status: row.status as Participation['status'], evidence: text(row.evidence), evidenceFile: evidenceByParticipation.get(text(row.id)) })),
    pointsLedger: ((points.data ?? []) as Row[]).map((row): PointsLedger => ({ id: text(row.id), userId: text(row.user_id), participationId: text(row.participation_id), points: Number(row.points), reason: text(row.reason), createdAt: text(row.created_at) })),
    badges: ((badges.data ?? []) as Row[]).map((row): Badge => ({ id: text(row.id), userId: text(row.user_id), name: text(row.name), awardedAt: text(row.awarded_at) })),
  };
}

export async function submitParticipation(input: { challengeId: string; organizationId: string; progress: number; evidence: string; file?: File }): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication is required.');
  const payload = { challenge_id: input.challengeId, organization_id: input.organizationId, user_id: user.id, progress: input.progress, evidence: input.evidence, status: 'submitted' };
  // Do not use UPSERT here: it turns a resubmission into an UPDATE but can
  // surface the wrong RLS policy error. Treat first and repeat submissions as
  // their distinct authorization paths.
  const { data: existing, error: lookupError } = await supabase
    .from('challenge_participations')
    .select('id, status')
    .eq('challenge_id', input.challengeId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (existing) {
    if (existing.status === 'approved') throw new Error('Approved participation cannot be changed.');
    const { error } = await supabase.from('challenge_participations').update(payload).eq('id', existing.id);
    if (error) throw new Error(error.message);
    if (input.file) await uploadEvidence(input.organizationId, user.id, existing.id, input.file);
    return;
  }
  const { data: created, error } = await supabase.from('challenge_participations').insert(payload).select('id').single();
  if (error) throw new Error(error.message);
  if (input.file) await uploadEvidence(input.organizationId, user.id, String(created.id), input.file);
}

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const maxFileSize = 10 * 1024 * 1024;
async function uploadEvidence(organizationId: string, userId: string, participationId: string, file: File): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (!allowedTypes.has(file.type)) throw new Error('Evidence must be a PDF, JPEG, PNG, or WebP image.');
  if (file.size > maxFileSize) throw new Error('Evidence files must be 10 MB or smaller.');
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'file';
  const path = `${organizationId}/${userId}/${participationId}/evidence.${extension}`;
  const { error: uploadError } = await supabase.storage.from('evidence').upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);
  const { error: metadataError } = await supabase.from('evidence_files').upsert({
    organization_id: organizationId, participation_id: participationId, uploaded_by: userId, storage_path: path,
    file_name: file.name, mime_type: file.type, byte_size: file.size,
  }, { onConflict: 'participation_id' });
  if (metadataError) throw new Error(metadataError.message);
}

export async function approveParticipation(participationId: string): Promise<{ points: number; awardedBadge?: string }> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error, response } = await supabase.functions.invoke('approve-participation', { body: { participation_id: participationId } });
  if (error) {
    const body = response ? await response.clone().json().catch(() => undefined) as { error?: string } | undefined : undefined;
    throw new Error(body?.error || error.message || 'The participation could not be approved.');
  }
  if (data?.error) throw new Error(data.error);
  return { points: Number(data?.points ?? 0), awardedBadge: data?.awarded_badge || undefined };
}
