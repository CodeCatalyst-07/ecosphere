import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Payload = { department_id?: string; factor_id?: string; quantity?: number; occurred_on?: string; note?: string };
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Authentication is required.' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SERVICE_ROLE_KEY')!);
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return json({ error: 'Invalid session.' }, 401);
  const payload = await request.json() as Payload;
  if (!payload.department_id || !payload.factor_id || !Number.isFinite(payload.quantity) || payload.quantity! <= 0 || !payload.occurred_on) return json({ error: 'A department, factor, positive quantity, and date are required.' }, 400);
  const { data: profile } = await admin.from('profiles').select('organization_id, role').eq('id', user.id).single();
  if (!profile || !['admin', 'manager'].includes(profile.role)) return json({ error: 'Only managers and admins can record operational activity.' }, 403);
  const { data, error } = await admin.rpc('record_carbon_activity', {
    p_actor_id: user.id, p_department_id: payload.department_id, p_factor_id: payload.factor_id,
    p_quantity: payload.quantity, p_occurred_on: payload.occurred_on, p_note: payload.note ?? '',
  });
  if (error) return json({ error: error.message }, 400);
  return json(data?.[0] ?? {}, 201);
});
