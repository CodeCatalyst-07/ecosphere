import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Dashboard = Record<string, unknown>;
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

  const [{ data: profile }, { data: dashboard, error: dashboardError }] = await Promise.all([
    admin.from('profiles').select('organization_id').eq('id', user.id).single(),
    client.rpc('get_dashboard'),
  ]);
  if (!profile || dashboardError || !dashboard) return json({ error: dashboardError?.message || 'Unable to load trusted metrics.' }, 400);
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to Supabase Edge Function secrets.' }, 503);

  const sourceMetrics = dashboard as Dashboard;
  const prompt = `You are EcoSphere's ESG decision-support assistant. Based only on the JSON metrics below, return one concise, practical recommendation. Do not invent facts, regulatory claims, or calculations. Return valid JSON only with keys: priority (Critical|High|Opportunity), title (max 60 chars), recommendation (max 240 chars), rationale (max 180 chars), route (environmental|governance|challenges).\n\nTrusted metrics:\n${JSON.stringify(sourceMetrics)}`;
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }),
  });
  if (!response.ok) return json({ error: 'Gemini could not generate an insight.' }, 502);
  const generated = await response.json();
  const raw = generated?.candidates?.[0]?.content?.parts?.[0]?.text;
  let recommendation: Record<string, unknown>;
  try { recommendation = JSON.parse(raw); } catch { return json({ error: 'Gemini returned an invalid insight.' }, 502); }

  const { data: insight, error: saveError } = await admin.from('ai_insights').insert({
    organization_id: profile.organization_id, requested_by: user.id, recommendation, source_metrics: sourceMetrics,
  }).select('id, recommendation, source_metrics, created_at').single();
  if (saveError) return json({ error: saveError.message }, 400);
  return json(insight, 201);
});
