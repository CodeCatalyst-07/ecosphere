import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Payload = { participation_id?: string };
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Authentication is required.' }, 401);
  const url = Deno.env.get('SUPABASE_URL')!;
  const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, Deno.env.get('SERVICE_ROLE_KEY')!);
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return json({ error: 'Invalid session.' }, 401);
  const payload = await request.json() as Payload;
  if (!payload.participation_id) return json({ error: 'A participation ID is required.' }, 400);
  const { data, error } = await admin.rpc('approve_challenge_participation', { p_actor_id: user.id, p_participation_id: payload.participation_id });
  if (error) return json({ error: error.message }, 400);
  return json(data?.[0] ?? {}, 201);
});
